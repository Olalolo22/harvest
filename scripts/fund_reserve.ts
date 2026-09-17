/**
 * fund_reserve.ts
 *
 * One-shot admin script to seed a vault's USDC premium reserve.
 * Must be run by the vault authority BEFORE the first lock_cycle().
 *
 * What it does:
 *   1. Derives the VaultConfig PDA for a given xStock mint
 *   2. Ensures the vault's USDC ATA exists (creates if needed)
 *   3. Transfers `amount` USDC from the authority's USDC ATA → vault_usdc_ata
 *
 * Usage:
 *   ANCHOR_WALLET=~/.config/solana/id.json \
 *   XSTOCK_MINT=<mint_pubkey> \
 *   USDC_AMOUNT=500 \
 *   CLUSTER=devnet \
 *   npx ts-node scripts/fund_reserve.ts
 *
 * USDC_AMOUNT is in whole USDC (e.g. 500 = 500 USDC = 500_000_000 base units).
 *
 * Devnet USDC mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
 *   (Coinbase devnet USDC — get from https://spl-token-faucet.com/)
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
  getAssociatedTokenAddressSync,
  createTransferCheckedInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getMint,
  getAccount,
} from "@solana/spl-token";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const PROGRAM_ID = new PublicKey(
  "34Y7acmqWosmkfPJjqRUQzrHFdxmxpQezLSvgD9bLJJo"
);

// Devnet USDC (Coinbase faucet mint)
const DEVNET_USDC_MINT = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

const CLUSTER = process.env.CLUSTER ?? "devnet";
const RPC =
  CLUSTER === "mainnet"
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com";

const XSTOCK_MINT_STR = process.env.XSTOCK_MINT;
if (!XSTOCK_MINT_STR) {
  console.error("❌  XSTOCK_MINT env var is required.");
  console.error(
    "    Example: XSTOCK_MINT=Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh npx ts-node scripts/fund_reserve.ts"
  );
  process.exit(1);
}

const USDC_AMOUNT_WHOLE = parseFloat(process.env.USDC_AMOUNT ?? "100");
if (isNaN(USDC_AMOUNT_WHOLE) || USDC_AMOUNT_WHOLE <= 0) {
  console.error("❌  USDC_AMOUNT must be a positive number (whole USDC).");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadWalletFromEnv(): Keypair {
  const walletPath =
    process.env.ANCHOR_WALLET ??
    path.join(process.env.HOME ?? "~", ".config", "solana", "id.json");
  const raw = fs.readFileSync(walletPath, "utf-8");
  const secretKey = Uint8Array.from(JSON.parse(raw));
  return Keypair.fromSecretKey(secretKey);
}

function deriveVaultConfigPDA(xstockMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault_config"), xstockMint.toBuffer()],
    PROGRAM_ID
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const connection = new Connection(RPC, "confirmed");
  const authority = loadWalletFromEnv();

  const xstockMint = new PublicKey(XSTOCK_MINT_STR!);
  const usdcMint = DEVNET_USDC_MINT;
  const USDC_DECIMALS = 6;
  const amountBaseUnits = BigInt(
    Math.round(USDC_AMOUNT_WHOLE * 10 ** USDC_DECIMALS)
  );

  console.log("────────────────────────────────────────────");
  console.log("  Harvest — Fund Reserve Script");
  console.log("────────────────────────────────────────────");
  console.log(`  Cluster       : ${CLUSTER} (${RPC})`);
  console.log(`  Authority     : ${authority.publicKey.toBase58()}`);
  console.log(`  xStock Mint   : ${xstockMint.toBase58()}`);
  console.log(`  USDC Mint     : ${usdcMint.toBase58()}`);
  console.log(
    `  Amount        : ${USDC_AMOUNT_WHOLE} USDC (${amountBaseUnits} base units)`
  );

  // 1. Derive VaultConfig PDA
  const [vaultConfigPDA, vaultBump] = deriveVaultConfigPDA(xstockMint);
  console.log(`\n  VaultConfig   : ${vaultConfigPDA.toBase58()} (bump=${vaultBump})`);

  // 2. Check authority has enough SOL
  const solBalance = await connection.getBalance(authority.publicKey);
  console.log(`  SOL balance   : ${(solBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  if (solBalance < 0.05 * LAMPORTS_PER_SOL) {
    console.warn(
      "\n⚠️   Low SOL balance — may not have enough for transaction fees."
    );
    console.warn(
      "    Run: solana airdrop 2 --url devnet"
    );
  }

  // 3. Get or create authority's USDC ATA
  console.log("\n📦  Checking authority USDC ATA...");
  const authorityUsdcAta = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,
    usdcMint,
    authority.publicKey,
    false,
    "confirmed",
    {},
    TOKEN_PROGRAM_ID
  );
  console.log(`  Authority USDC ATA : ${authorityUsdcAta.address.toBase58()}`);
  console.log(
    `  Authority USDC bal : ${Number(authorityUsdcAta.amount) / 10 ** USDC_DECIMALS} USDC`
  );

  if (authorityUsdcAta.amount < amountBaseUnits) {
    console.error(
      `\n❌  Insufficient USDC. Have ${Number(authorityUsdcAta.amount) / 10 ** USDC_DECIMALS}, need ${USDC_AMOUNT_WHOLE}.`
    );
    console.error(
      "    Get devnet USDC at: https://spl-token-faucet.com/?token-name=USDC-Dev"
    );
    process.exit(1);
  }

  // 4. Get or create vault's USDC ATA (owned by VaultConfig PDA)
  console.log("\n📦  Checking vault USDC ATA...");
  const vaultUsdcAta = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,          // payer for creation
    usdcMint,
    vaultConfigPDA,     // owner = PDA
    true,               // allowOwnerOffCurve = true for PDAs
    "confirmed",
    {},
    TOKEN_PROGRAM_ID
  );
  console.log(`  Vault USDC ATA     : ${vaultUsdcAta.address.toBase58()}`);
  console.log(
    `  Vault USDC bal     : ${Number(vaultUsdcAta.amount) / 10 ** USDC_DECIMALS} USDC (before transfer)`
  );

  // 5. Transfer USDC authority → vault
  console.log(
    `\n💸  Transferring ${USDC_AMOUNT_WHOLE} USDC to vault reserve...`
  );

  const transferIx = createTransferCheckedInstruction(
    authorityUsdcAta.address,   // source
    usdcMint,                   // mint
    vaultUsdcAta.address,       // destination
    authority.publicKey,        // authority
    amountBaseUnits,            // amount
    USDC_DECIMALS,              // decimals
    [],
    TOKEN_PROGRAM_ID
  );

  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const tx = new anchor.web3.Transaction();
  tx.recentBlockhash = blockhash;
  tx.feePayer = authority.publicKey;
  tx.add(transferIx);

  const sig = await anchor.web3.sendAndConfirmTransaction(
    connection,
    tx,
    [authority],
    { commitment: "confirmed" }
  );

  console.log(`\n✅  Transfer confirmed!`);
  console.log(`  Signature : ${sig}`);
  console.log(
    `  Explorer  : https://explorer.solana.com/tx/${sig}?cluster=${CLUSTER}`
  );

  // 6. Verify final balance
  const vaultUsdcFinal = await getAccount(
    connection,
    vaultUsdcAta.address,
    "confirmed",
    TOKEN_PROGRAM_ID
  );
  console.log(
    `\n  Vault USDC balance (after) : ${Number(vaultUsdcFinal.amount) / 10 ** USDC_DECIMALS} USDC`
  );
  console.log("\n🎉  Reserve funded. Vault is ready for lock_cycle().\n");
}

main().catch((err) => {
  console.error("\n❌  Error:", err.message ?? err);
  process.exit(1);
});
