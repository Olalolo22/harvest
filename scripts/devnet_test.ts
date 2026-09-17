/**
 * devnet_test.ts
 *
 * Full lifecycle test for the Harvest protocol on devnet.
 * Walks through: initialize → deposit → lock_cycle → settle_otm → claim
 *
 * Prerequisites:
 *   - Anchor program deployed to devnet at the PROGRAM_ID below
 *   - Authority wallet has ≥ 0.5 SOL on devnet
 *   - xStock mint address set in XSTOCK_MINT env var
 *   - Devnet USDC in authority wallet (for premium reserve seeding)
 *
 * Usage:
 *   ANCHOR_WALLET=~/.config/solana/id.json \
 *   XSTOCK_MINT=<mint_pubkey> \
 *   npx ts-node scripts/devnet_test.ts
 */

import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  createMint,
} from "@solana/spl-token";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const PROGRAM_ID = new PublicKey(
  "34Y7acmqWosmkfPJjqRUQzrHFdxmxpQezLSvgD9bLJJo"
);
const DEVNET_USDC_MINT = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);
const CLUSTER = "devnet";
const RPC = "https://api.devnet.solana.com";

// Simulated prices in 6-decimal USD precision (PRICE_PRECISION = 1_000_000)
const MOCK_LOCK_PRICE  = 191_580_000n;  // $191.58  — NVDA example
const MOCK_SETTLE_OTM  = 190_000_000n;  // $190.00  — below strike → OTM ✅
// Strike = lock_price × (1 + strike_offset_bps/10000) = 191.58 × 1.03 = 197.33

// Test parameters
const TICKER = Buffer.from("NVDA\0\0\0\0");  // 8 bytes
const STRIKE_OFFSET_BPS = 300;               // 3% OTM
const PREMIUM_RATE_BPS  = 150;               // 1.5% weekly
const CYCLE_DURATION    = 60;                // 60 seconds for fast devnet test
const DEPOSIT_AMOUNT    = 1_000_000n;        // 1 xStock token (6 decimals)
const RESERVE_USDC      = 100_000_000n;      // 100 USDC to seed reserve

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadWallet(): Keypair {
  const walletPath =
    process.env.ANCHOR_WALLET ??
    path.join(process.env.HOME ?? "~", ".config", "solana", "id.json");
  return Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
}

function pda(seeds: Buffer[], programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function pass(label: string) {
  console.log(`  ✅  ${label}`);
}

function fail(label: string, err: unknown) {
  console.error(`  ❌  ${label}`);
  throw err;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const connection = new Connection(RPC, "confirmed");
  const authority = loadWallet();

  console.log("══════════════════════════════════════════════");
  console.log("  Harvest Protocol — Devnet Lifecycle Test");
  console.log("══════════════════════════════════════════════");
  console.log(`  RPC        : ${RPC}`);
  console.log(`  Authority  : ${authority.publicKey.toBase58()}`);
  console.log(`  Program ID : ${PROGRAM_ID.toBase58()}`);

  // Load IDL
  const idlPath = path.join(__dirname, "..", "idl", "harvest.json");
  if (!fs.existsSync(idlPath)) {
    throw new Error(`IDL not found at ${idlPath}. Run anchor build first.`);
  }
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(authority),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  const program = new anchor.Program(idl, PROGRAM_ID, provider);

  // Check SOL balance
  const solBal = await connection.getBalance(authority.publicKey);
  log(`Authority SOL balance: ${(solBal / LAMPORTS_PER_SOL).toFixed(4)}`);
  if (solBal < 0.3 * LAMPORTS_PER_SOL) {
    throw new Error(
      "Need at least 0.3 SOL on devnet. Run: solana airdrop 2 --url devnet"
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 1: Resolve xStock mint
  // ──────────────────────────────────────────────────────────────────────────
  log("\n─── STEP 1: xStock Mint ───");
  let xstockMint: PublicKey;

  if (process.env.XSTOCK_MINT) {
    xstockMint = new PublicKey(process.env.XSTOCK_MINT);
    log(`Using existing xStock mint: ${xstockMint.toBase58()}`);
  } else {
    // Create a fresh test Token-2022 mint for isolated devnet testing
    log("No XSTOCK_MINT env var — creating a fresh Token-2022 test mint...");
    xstockMint = await createMint(
      connection,
      authority,
      authority.publicKey,   // mint authority
      null,                  // freeze authority
      6,                     // decimals
      Keypair.generate(),
      {},
      TOKEN_2022_PROGRAM_ID
    );
    log(`Created test xStock mint: ${xstockMint.toBase58()}`);
    log("(Set XSTOCK_MINT to this value to reuse it across runs)");
  }
  pass("xStock mint ready");

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 2: Derive PDAs
  // ──────────────────────────────────────────────────────────────────────────
  log("\n─── STEP 2: Derive PDAs ───");
  const [vaultConfigPDA] = pda(
    [Buffer.from("vault_config"), xstockMint.toBuffer()],
    PROGRAM_ID
  );
  log(`VaultConfig PDA: ${vaultConfigPDA.toBase58()}`);
  pass("PDAs derived");

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 3: Initialize vault
  // ──────────────────────────────────────────────────────────────────────────
  log("\n─── STEP 3: Initialize Vault ───");

  const vaultXstockAta = await getOrCreateAssociatedTokenAccount(
    connection, authority, xstockMint, vaultConfigPDA, true, "confirmed", {}, TOKEN_2022_PROGRAM_ID
  );
  const vaultUsdcAta = await getOrCreateAssociatedTokenAccount(
    connection, authority, DEVNET_USDC_MINT, vaultConfigPDA, true, "confirmed", {}, TOKEN_PROGRAM_ID
  );

  const vaultConfigInfo = await connection.getAccountInfo(vaultConfigPDA);
  if (vaultConfigInfo) {
    log("VaultConfig already exists — skipping initialize.");
    pass("initialize (skipped — already exists)");
  } else {
    try {
      const tx = await program.methods
        .initialize(
          Array.from(TICKER),
          STRIKE_OFFSET_BPS,
          PREMIUM_RATE_BPS,
          new anchor.BN(CYCLE_DURATION)
        )
        .accounts({
          authority: authority.publicKey,
          vaultConfig: vaultConfigPDA,
          xstockMint,
          usdcMint: DEVNET_USDC_MINT,
          vaultXstockAta: vaultXstockAta.address,
          vaultUsdcAta: vaultUsdcAta.address,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenProgram2022: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      log(`initialize tx: ${tx}`);
      pass("initialize()");
    } catch (e) {
      fail("initialize()", e);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 4: Seed USDC reserve
  // ──────────────────────────────────────────────────────────────────────────
  log("\n─── STEP 4: Seed USDC Reserve ───");
  const vaultUsdcInfo = await getAccount(connection, vaultUsdcAta.address, "confirmed", TOKEN_PROGRAM_ID);
  log(`Vault USDC balance: ${Number(vaultUsdcInfo.amount) / 1e6} USDC`);
  if (vaultUsdcInfo.amount < RESERVE_USDC) {
    log("Balance below 100 USDC — run fund_reserve.ts first.");
    log(`  XSTOCK_MINT=${xstockMint.toBase58()} USDC_AMOUNT=100 npx ts-node scripts/fund_reserve.ts`);
    log("Continuing test (claim step may fail without reserve)...");
  } else {
    pass("USDC reserve seeded");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 5: Mint xStock to authority & deposit
  // ──────────────────────────────────────────────────────────────────────────
  log("\n─── STEP 5: Deposit ───");

  const userXstockAta = await getOrCreateAssociatedTokenAccount(
    connection, authority, xstockMint, authority.publicKey, false, "confirmed", {}, TOKEN_2022_PROGRAM_ID
  );

  // Mint test tokens to authority if using a fresh mint
  if (!process.env.XSTOCK_MINT) {
    await mintTo(
      connection, authority, xstockMint, userXstockAta.address,
      authority, DEPOSIT_AMOUNT * 10n, [], {}, TOKEN_2022_PROGRAM_ID
    );
    log(`Minted ${DEPOSIT_AMOUNT * 10n} xStock to authority ATA`);
  }

  const vaultState = await program.account.vaultConfig.fetch(vaultConfigPDA);
  const currentCycle: anchor.BN = vaultState.currentCycle;

  const [userPositionPDA] = pda(
    [
      Buffer.from("position"),
      vaultConfigPDA.toBuffer(),
      authority.publicKey.toBuffer(),
      currentCycle.toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  );
  log(`UserPosition PDA: ${userPositionPDA.toBase58()}`);

  const positionExists = await connection.getAccountInfo(userPositionPDA);
  if (positionExists) {
    log("UserPosition already exists — skipping deposit.");
    pass("deposit (skipped — position exists)");
  } else {
    try {
      const tx = await program.methods
        .deposit(new anchor.BN(DEPOSIT_AMOUNT.toString()))
        .accounts({
          owner: authority.publicKey,
          vaultConfig: vaultConfigPDA,
          xstockMint,
          userXstockAta: userXstockAta.address,
          vaultXstockAta: vaultXstockAta.address,
          userPosition: userPositionPDA,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      log(`deposit tx: ${tx}`);
      pass("deposit()");
    } catch (e) {
      fail("deposit()", e);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 6: Lock cycle
  // ──────────────────────────────────────────────────────────────────────────
  log("\n─── STEP 6: Lock Cycle ───");
  const vaultStateAfterDeposit = await program.account.vaultConfig.fetch(vaultConfigPDA);
  const cycleStateName = Object.keys(vaultStateAfterDeposit.cycleState)[0];
  log(`Current cycle state: ${cycleStateName}`);

  if (cycleStateName !== "acceptingDeposits") {
    log("Vault not in AcceptingDeposits — skipping lock_cycle.");
    pass("lock_cycle (skipped)");
  } else {
    try {
      const tx = await program.methods
        .lockCycle(new anchor.BN(MOCK_LOCK_PRICE.toString()))
        .accounts({
          authority: authority.publicKey,
          vaultConfig: vaultConfigPDA,
        })
        .rpc();
      log(`lock_cycle tx: ${tx}`);
      pass("lock_cycle()");
    } catch (e) {
      fail("lock_cycle()", e);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 7: Wait for settle window, then settle OTM
  // ──────────────────────────────────────────────────────────────────────────
  log("\n─── STEP 7: Settle OTM ───");
  const vaultAfterLock = await program.account.vaultConfig.fetch(vaultConfigPDA);
  const settleAfter: anchor.BN = vaultAfterLock.settleAfter;
  const now = Math.floor(Date.now() / 1000);
  const waitSecs = Math.max(0, settleAfter.toNumber() - now + 2);

  if (waitSecs > 0) {
    log(`Waiting ${waitSecs}s for settle window to open...`);
    await sleep(waitSecs * 1000);
  }

  const vaultStatePreSettle = await program.account.vaultConfig.fetch(vaultConfigPDA);
  const preSettleState = Object.keys(vaultStatePreSettle.cycleState)[0];

  if (preSettleState === "settled") {
    log("Vault already settled — skipping settle_otm.");
    pass("settle_otm (skipped)");
  } else {
    try {
      const tx = await program.methods
        .settleOtm(new anchor.BN(MOCK_SETTLE_OTM.toString()))
        .accounts({
          authority: authority.publicKey,
          vaultConfig: vaultConfigPDA,
        })
        .rpc();
      log(`settle_otm tx: ${tx}`);
      pass("settle_otm()");
    } catch (e) {
      fail("settle_otm()", e);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 8: Claim
  // ──────────────────────────────────────────────────────────────────────────
  log("\n─── STEP 8: Claim ───");

  const userUsdcAta = await getOrCreateAssociatedTokenAccount(
    connection, authority, DEVNET_USDC_MINT, authority.publicKey, false, "confirmed", {}, TOKEN_PROGRAM_ID
  );

  const positionState = await program.account.userPosition.fetch(userPositionPDA);
  const posStateName = Object.keys(positionState.state)[0];
  log(`Position state: ${posStateName}`);

  if (posStateName === "claimed") {
    log("Position already claimed.");
    pass("claim (skipped — already claimed)");
  } else {
    try {
      const tx = await program.methods
        .claim()
        .accounts({
          owner: authority.publicKey,
          vaultConfig: vaultConfigPDA,
          xstockMint,
          vaultXstockAta: vaultXstockAta.address,
          userXstockAta: userXstockAta.address,
          vaultUsdcAta: vaultUsdcAta.address,
          userUsdcAta: userUsdcAta.address,
          userPosition: userPositionPDA,
          tokenProgram2022: TOKEN_2022_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      log(`claim tx: ${tx}`);
      pass("claim()");
    } catch (e) {
      fail("claim()", e);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 9: Final state check
  // ──────────────────────────────────────────────────────────────────────────
  log("\n─── STEP 9: Final State ───");
  const finalVault = await program.account.vaultConfig.fetch(vaultConfigPDA);
  const finalPosition = await program.account.userPosition.fetch(userPositionPDA);
  const finalUsdcAta = await getAccount(connection, userUsdcAta.address, "confirmed", TOKEN_PROGRAM_ID);

  console.log(`\n  Vault state         : ${Object.keys(finalVault.cycleState)[0]}`);
  console.log(`  Vault cycle         : ${finalVault.currentCycle.toString()}`);
  console.log(`  Total premium dist  : ${Number(finalVault.totalPremiumDistributed) / 1e6} USDC`);
  console.log(`  Position state      : ${Object.keys(finalPosition.state)[0]}`);
  console.log(`  User USDC balance   : ${Number(finalUsdcAta.amount) / 1e6} USDC`);

  console.log("\n══════════════════════════════════════════════");
  console.log("  🎉  All lifecycle steps passed on devnet!  ");
  console.log("══════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("\n❌  Test failed:", err?.message ?? err);
  if (err?.logs) {
    console.error("\nProgram logs:");
    err.logs.forEach((l: string) => console.error(" ", l));
  }
  process.exit(1);
});
