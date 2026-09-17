/**
 * keeper.ts
 *
 * Automated keeper daemon for Harvest vaults.
 * Polls vault state every POLL_INTERVAL_MS and:
 *   - Calls lock_cycle() when ACCEPTING + lock delay reached
 *   - Calls settle_otm() or settle_itm() when LOCKED + settle_after reached
 *
 * Price sources:
 *   1. Official Pyth Hermes (if PYTH_API_KEY is provided)
 *   2. Free live equity market price feed (Yahoo Finance API)
 *   3. Deterministic demo fallback
 *
 * Usage:
 *   # Continuous polling daemon:
 *   npx tsx scripts/keeper.ts
 *
 *   # Single pass (check & execute once):
 *   RUN_ONCE=true npx tsx scripts/keeper.ts
 *
 *   # Custom vault mint or lock delay:
 *   XSTOCK_MINT=EM5uTvQNpeTt4P1vRyfRdvtku42MytZjRsPG7KG4BRqV LOCK_DELAY=30 npx tsx scripts/keeper.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import {
  getAccount,
  getOrCreateAssociatedTokenAccount,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import fs from "fs";
import path from "path";

// --------------------------------------------------------------------------
// Config
// --------------------------------------------------------------------------
const PROGRAM_ID = new PublicKey("34Y7acmqWosmkfPJjqRUQzrHFdxmxpQezLSvgD9bLJJo");
const CLUSTER = process.env.CLUSTER ?? "devnet";
const RPC =
  process.env.RPC_URL ??
  (CLUSTER === "mainnet"
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com");

const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS ?? "10000"); // 10s default
const RUN_ONCE = process.env.RUN_ONCE === "true";

// Known xStock vault mint addresses
const VAULT_MINTS: Record<string, string> = {
  DEVNET_TEST:
    process.env.XSTOCK_MINT ?? "EM5uTvQNpeTt4P1vRyfRdvtku42MytZjRsPG7KG4BRqV",
  NVDA: process.env.XNVDA_MINT ?? "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
  AAPL: process.env.XAAPL_MINT ?? "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
  TSLA: process.env.XTSLA_MINT ?? "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
};

// Pyth Hermes feed IDs (US Equities)
const PYTH_FEEDS: Record<string, string> = {
  DEVNET_TEST: "b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593",
  NVDA: "b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593",
  AAPL: "49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688",
  TSLA: "16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1",
};

// Seconds after cycle opens before keeper locks it
// Devnet default: 10s. Production: 172800s (48h open window)
const LOCK_DELAY_SECONDS = parseInt(process.env.LOCK_DELAY ?? "10");

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadWallet(): Keypair {
  const walletPath =
    process.env.ANCHOR_WALLET ??
    path.join(process.env.HOME ?? "~", ".config", "solana", "id.json");
  return Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
}

// --------------------------------------------------------------------------
// Multi-source price fetcher
// --------------------------------------------------------------------------
async function fetchPrice(ticker: string, feedId?: string): Promise<{ priceUnits: number; usd: number; source: string }> {
  // 1. Pyth Hermes (if PYTH_API_KEY is set)
  if (process.env.PYTH_API_KEY && feedId) {
    try {
      const url = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}&encoding=base64`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${process.env.PYTH_API_KEY}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        const p = data.parsed?.[0]?.price;
        if (p) {
          const usd = Number(p.price) * Math.pow(10, p.expo);
          return { priceUnits: Math.round(usd * 1_000_000), usd, source: "Pyth Hermes" };
        }
      }
    } catch (e: any) {
      console.warn(`[${ticker}] Pyth Hermes error: ${e?.message ?? e}`);
    }
  }

  // 2. Real-time Equity Market Feed (Yahoo Finance)
  try {
    const symbol = ticker.replace("DEVNET_TEST", "NVDA").replace("TEST_", "").replace("x", "");
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (resp.ok) {
      const data = await resp.json();
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (typeof price === "number" && price > 0) {
        return { priceUnits: Math.round(price * 1_000_000), usd: price, source: `Live Market (${symbol})` };
      }
    }
  } catch (e: any) {
    console.warn(`[${ticker}] Market price fetch error: ${e?.message ?? e}`);
  }

  // 3. Fallback Demo Prices
  const DEMO: Record<string, number> = {
    DEVNET_TEST: 213.90,
    NVDA: 213.90,
    AAPL: 332.41,
    TSLA: 358.08,
  };
  const usd = DEMO[ticker] ?? 200.00;
  return { priceUnits: Math.round(usd * 1_000_000), usd, source: "Fallback Demo" };
}

// --------------------------------------------------------------------------
// Main Keeper Loop
// --------------------------------------------------------------------------
async function main() {
  const connection = new Connection(RPC, "confirmed");
  const walletKeypair = loadWallet();
  const wallet = new anchor.Wallet(walletKeypair);

  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  const idlPath = path.join(__dirname, "..", "idl", "harvest.json");
  if (!fs.existsSync(idlPath)) {
    throw new Error(`IDL not found at ${idlPath}`);
  }
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const program = new anchor.Program(idl, PROGRAM_ID, provider);

  console.log("══════════════════════════════════════════════════════════");
  console.log("  🌾 Harvest Protocol — Automated Keeper Bot");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`  Cluster        : ${CLUSTER}`);
  console.log(`  RPC            : ${RPC}`);
  console.log(`  Authority      : ${walletKeypair.publicKey.toBase58()}`);
  console.log(`  Program ID     : ${PROGRAM_ID.toBase58()}`);
  console.log(`  Poll interval  : ${POLL_INTERVAL_MS}ms`);
  console.log(`  Lock delay     : ${LOCK_DELAY_SECONDS}s`);
  console.log(`  Mode           : ${RUN_ONCE ? "Single Pass (RUN_ONCE)" : "Continuous Daemon"}`);
  console.log("══════════════════════════════════════════════════════════\n");

  let running = true;
  while (running) {
    for (const [ticker, mintStr] of Object.entries(VAULT_MINTS)) {
      if (!mintStr || mintStr.startsWith("TODO")) continue;

      try {
        const xstockMint = new PublicKey(mintStr);
        const [vaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("vault_config"), xstockMint.toBuffer()],
          PROGRAM_ID
        );

        const vaultInfo = await connection.getAccountInfo(vaultPda);
        if (!vaultInfo) {
          // Vault not deployed on this cluster yet
          continue;
        }

        const vault: any = await program.account.vaultConfig.fetch(vaultPda);
        const now = Math.floor(Date.now() / 1000);
        const cycleStateName = Object.keys(vault.cycleState)[0];

        // -------------------------------------------------------------------
        // State 1: ACCEPTING DEPOSITS → LOCK CYCLE
        // -------------------------------------------------------------------
        if (cycleStateName === "acceptingDeposits") {
          const lockTime = vault.cycleLockedAt.toNumber() + LOCK_DELAY_SECONDS;
          const remainingSecs = Math.max(0, lockTime - now);

          if (remainingSecs === 0) {
            console.log(`[${ticker}] Cycle ${vault.currentCycle}: Lock delay reached. Fetching oracle price...`);
            const { priceUnits, usd, source } = await fetchPrice(ticker, PYTH_FEEDS[ticker]);
            console.log(`[${ticker}] Price: $${usd.toFixed(2)} (${source}). Locking cycle on-chain...`);

            const tx = await program.methods
              .lockCycle(new anchor.BN(priceUnits))
              .accounts({
                authority: wallet.publicKey,
                vaultConfig: vaultPda,
              })
              .rpc();

            const strikeOffset = vault.strikeOffsetBps / 100;
            const strikeUsd = usd * (1 + vault.strikeOffsetBps / 10_000);
            console.log(`[${ticker}] ✅ Cycle ${vault.currentCycle} LOCKED!`);
            console.log(`  Strike (+${strikeOffset}%): $${strikeUsd.toFixed(2)} | tx: ${tx}\n`);
          } else {
            console.log(`[${ticker}] Cycle ${vault.currentCycle} accepting deposits. Locking in ${remainingSecs}s.`);
          }
        }

        // -------------------------------------------------------------------
        // State 2: CYCLE LOCKED → SETTLE
        // -------------------------------------------------------------------
        else if (cycleStateName === "cycleLocked") {
          const settleAfter = vault.settleAfter.toNumber();
          const remainingSecs = Math.max(0, settleAfter - now);

          if (remainingSecs === 0) {
            console.log(`[${ticker}] Cycle ${vault.currentCycle}: Settle window reached! Fetching settlement price...`);
            const { priceUnits, usd, source } = await fetchPrice(ticker, PYTH_FEEDS[ticker]);
            const strikePriceUnits = vault.strikePrice.toNumber();
            const strikeUsd = strikePriceUnits / 1_000_000;

            console.log(`[${ticker}] Settlement Price: $${usd.toFixed(2)} (${source}) vs Strike: $${strikeUsd.toFixed(2)}`);

            if (priceUnits < strikePriceUnits) {
              // Out-Of-The-Money: xStock kept, full premium distributed
              console.log(`[${ticker}] 🟢 OTM (Price < Strike). Executing settle_otm()...`);
              const tx = await program.methods
                .settleOtm(new anchor.BN(priceUnits))
                .accounts({
                  authority: wallet.publicKey,
                  vaultConfig: vaultPda,
                })
                .rpc();
              console.log(`[${ticker}] ✅ Cycle ${vault.currentCycle} settled OTM! tx: ${tx}\n`);
            } else {
              // In-The-Money: stock called away, settled with USDC proceeds
              console.log(`[${ticker}] 🔴 ITM (Price >= Strike). Executing settle_itm()...`);

              const keeperUsdcAta = await getOrCreateAssociatedTokenAccount(
                connection,
                walletKeypair,
                vault.usdcMint,
                wallet.publicKey,
                false,
                "confirmed",
                {},
                TOKEN_PROGRAM_ID
              );

              // Calculate proceeds
              const depositedTokens = Number(vault.totalXstockDeposited) / 10 ** vault.xstockDecimals;
              const usdcProceeds = BigInt(Math.round(depositedTokens * strikeUsd * 1_000_000));

              const tx = await program.methods
                .settleItm(new anchor.BN(priceUnits), new anchor.BN(usdcProceeds.toString()))
                .accounts({
                  authority: wallet.publicKey,
                  vaultConfig: vaultPda,
                  keeperUsdcAta: keeperUsdcAta.address,
                  vaultUsdcAta: vault.vaultUsdcAta,
                  tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();
              console.log(`[${ticker}] ✅ Cycle ${vault.currentCycle} settled ITM! tx: ${tx}\n`);
            }
          } else {
            console.log(`[${ticker}] Cycle ${vault.currentCycle} locked. Settles in ${remainingSecs}s.`);
          }
        }

        // -------------------------------------------------------------------
        // State 3: SETTLED
        // -------------------------------------------------------------------
        else if (cycleStateName === "settled") {
          console.log(`[${ticker}] Cycle ${vault.currentCycle} is settled. Pending claims: ${vault.pendingClaims}.`);
        }
      } catch (err: any) {
        console.error(`[${ticker}] Error: ${err?.message ?? err}`);
      }
    }

    if (RUN_ONCE) {
      console.log("\n[keeper] Single pass complete (RUN_ONCE=true). Exiting.");
      break;
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

main().catch((err) => {
  console.error("Fatal keeper error:", err);
  process.exit(1);
});
