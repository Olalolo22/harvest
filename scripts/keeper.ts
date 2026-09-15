/**
 * keeper.ts
 *
 * Automated keeper for Harvest vaults.
 * Polls vault state every POLL_INTERVAL_MS and:
 *   - Calls lock_cycle() when ACCEPTING + time reached
 *   - Calls settle_otm() or settle_itm() when LOCKED + settle_after reached
 *
 * For ITM settlement, calls Jupiter API to swap xStock → USDC first,
 * then calls settle_itm() with the USDC proceeds.
 *
 * Usage:
 *   ANCHOR_WALLET=~/.config/solana/id.json \
 *   CLUSTER=devnet \
 *   npx ts-node scripts/keeper.ts
 *
 * For demo (5-minute cycles), set CYCLE_DEMO=true
 */

import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { getAccount, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import fs from "fs";

// --------------------------------------------------------------------------
// Config — update after deploying
// --------------------------------------------------------------------------
const PROGRAM_ID = new PublicKey("34Y7acmqWosmkfPJjqRUQzrHFdxmxpQezLSvgD9bLJJo");
const CLUSTER = process.env.CLUSTER ?? "devnet";
const RPC =
  CLUSTER === "mainnet"
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com";
const POLL_INTERVAL_MS = 10_000; // 10 seconds

// xStock vault mint addresses — fill in after Day 1 verification
const VAULT_MINTS: Record<string, string> = {
  NVDA: process.env.XNVDA_MINT ?? "TODO_XNVDA_MINT",
  AAPL: process.env.XAAPL_MINT ?? "TODO_XAAPL_MINT",
  TSLA: process.env.XTSLA_MINT ?? "TODO_XTSLA_MINT",
};

// Pyth Hermes feed IDs
const PYTH_FEEDS: Record<string, string> = {
  NVDA: "b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593",
  AAPL: "49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688",
  TSLA: "16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1",
};

// How long to wait before locking a new cycle (seconds after cycle opens)
// Demo: 120s (2 min). Production: set to match your desired open window.
const LOCK_DELAY_SECONDS = parseInt(process.env.LOCK_DELAY ?? "120");

// --------------------------------------------------------------------------
// Pyth price fetcher
// --------------------------------------------------------------------------
async function fetchPythPrice(feedId: string): Promise<number> {
  const url = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}&encoding=base64`;
  const resp = await fetch(url);
  const data = await resp.json();
  const price = data.parsed?.[0]?.price;
  if (!price) throw new Error(`No price data for feed ${feedId}`);
  // Convert to USD with 6 decimal places
  const usdPrice = Number(price.price) * Math.pow(10, price.expo);
  return Math.round(usdPrice * 1_000_000); // Return as i64 with PRICE_PRECISION
}

// --------------------------------------------------------------------------
// Jupiter swap helper (for ITM settlement)
// --------------------------------------------------------------------------
async function swapXstockToUsdc(
  xstockMint: string,
  usdcMint: string,
  amount: number,
  userPublicKey: string
): Promise<{ usdc_received: number; swap_tx: string }> {
  // 1. Get quote from Jupiter
  const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${xstockMint}&outputMint=${usdcMint}&amount=${amount}&slippageBps=50`;
  const quoteResp = await fetch(quoteUrl);
  const quote = await quoteResp.json();

  // 2. Get swap transaction
  const swapResp = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: false,
    }),
  });
  const swapData = await swapResp.json();

  // In production: sign and send swapData.swapTransaction here
  // Return the estimated USDC output
  return {
    usdc_received: parseInt(quote.outAmount),
    swap_tx: swapData.swapTransaction,
  };
}

// --------------------------------------------------------------------------
// Keeper main loop
// --------------------------------------------------------------------------
async function main() {
  const connection = new Connection(RPC, "confirmed");

  // Load wallet
  const walletPath =
    process.env.ANCHOR_WALLET ?? `${process.env.HOME}/.config/solana/id.json`;
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
  const wallet = new anchor.Wallet(walletKeypair);

  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  // Load program IDL (generated after anchor build)
  // const idl = JSON.parse(fs.readFileSync("./target/idl/harvest.json", "utf-8"));
  // const program = new anchor.Program(idl, PROGRAM_ID, provider);

  console.log(`Harvest keeper starting on ${CLUSTER}`);
  console.log(`Authority: ${walletKeypair.publicKey.toBase58()}`);
  console.log(`Poll interval: ${POLL_INTERVAL_MS}ms`);
  console.log(`Lock delay: ${LOCK_DELAY_SECONDS}s after cycle opens\n`);

  while (true) {
    for (const [ticker, mintStr] of Object.entries(VAULT_MINTS)) {
      if (mintStr.startsWith("TODO")) {
        console.log(`[${ticker}] ⚠️  Mint not configured — skipping`);
        continue;
      }

      try {
        // Derive vault PDA
        const xstockMint = new PublicKey(mintStr);
        const [vaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("vault_config"), xstockMint.toBuffer()],
          PROGRAM_ID
        );

        // TODO: fetch vault account once program IDL is available
        // const vault = await program.account.vaultConfig.fetch(vaultPda);
        // const now = Math.floor(Date.now() / 1000);

        // Placeholder cycle logic (wire up after anchor build):
        console.log(`[${ticker}] vault PDA: ${vaultPda.toBase58()} — polling...`);

        // === ACCEPTING DEPOSITS ===
        // if (vault.cycleState.acceptingDeposits !== undefined) {
        //   if (now >= vault.cycleLockedAt.toNumber() + LOCK_DELAY_SECONDS) {
        //     console.log(`[${ticker}] Locking cycle ${vault.currentCycle}...`);
        //     const price = await fetchPythPrice(PYTH_FEEDS[ticker]);
        //     await program.methods
        //       .lockCycle(new anchor.BN(price))
        //       .accounts({ authority: wallet.publicKey, vaultConfig: vaultPda })
        //       .rpc();
        //     console.log(`[${ticker}] ✅ Cycle locked at price $${price / 1_000_000}`);
        //   }
        // }

        // === CYCLE LOCKED ===
        // if (vault.cycleState.cycleLocked !== undefined) {
        //   if (now >= vault.settleAfter.toNumber()) {
        //     const settlementPrice = await fetchPythPrice(PYTH_FEEDS[ticker]);
        //     if (settlementPrice < vault.strikePrice.toNumber()) {
        //       console.log(`[${ticker}] OTM — settling at $${settlementPrice / 1_000_000}`);
        //       await program.methods
        //         .settleOtm(new anchor.BN(settlementPrice))
        //         .accounts({ authority: wallet.publicKey, vaultConfig: vaultPda })
        //         .rpc();
        //       console.log(`[${ticker}] ✅ OTM settled`);
        //     } else {
        //       console.log(`[${ticker}] ITM — running Jupiter swap then settling`);
        //       // 1. Get xStock balance in vault
        //       const vaultAta = vault.vaultXstockAta;
        //       const ataInfo = await getAccount(connection, vaultAta, "confirmed", TOKEN_2022_PROGRAM_ID);
        //       const xstockBalance = Number(ataInfo.amount);
        //       // 2. Swap via Jupiter
        //       const { usdc_received } = await swapXstockToUsdc(
        //         mintStr, vault.usdcMint.toBase58(), xstockBalance, wallet.publicKey.toBase58()
        //       );
        //       // 3. Call settle_itm
        //       await program.methods
        //         .settleItm(new anchor.BN(settlementPrice), new anchor.BN(usdc_received))
        //         .accounts({
        //           authority: wallet.publicKey,
        //           vaultConfig: vaultPda,
        //           keeperUsdcAta: keeperUsdcAta,
        //           vaultUsdcAta: vault.vaultUsdcAta,
        //           tokenProgram: TOKEN_PROGRAM_ID,
        //         })
        //         .rpc();
        //       console.log(`[${ticker}] ✅ ITM settled. USDC proceeds: ${usdc_received}`);
        //     }
        //   }
        // }
      } catch (err) {
        console.error(`[${ticker}] Error: ${err}`);
      }
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

main().catch(console.error);
