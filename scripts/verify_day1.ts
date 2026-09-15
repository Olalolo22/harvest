/**
 * verify_day1.ts
 *
 * Run BEFORE writing any vault code or deploying.
 * Verifies xStock mint addresses, decimals, and Token-2022 extensions.
 *
 * Usage:
 *   npx ts-node scripts/verify_day1.ts
 *
 * What to look for in output:
 *   - Confirm decimals (update constants.rs if not 6)
 *   - Check "Transfer Hook: program_id=..." — if present, deposit.rs needs
 *     remaining_accounts with that hook program and its extra accounts
 *   - Confirm Pyth feed IDs match expected symbols
 */

import { Connection, PublicKey } from "@solana/web3.js";
import {
  getMint,
  TOKEN_2022_PROGRAM_ID,
  getTransferHook,
  getExtensionData,
  ExtensionType,
} from "@solana/spl-token";

// --------------------------------------------------------------------------
// FILL THESE IN after finding the mints via xstocks.fi UI or Solana explorer
// Search: https://explorer.solana.com/address/<MINT>
// Or: https://solscan.io/token/<MINT>
// --------------------------------------------------------------------------
// All three verified on mainnet Sep 15 2026 via spl-token display
// Token-2022, 8 decimals, transferHook programId=null (inactive) on all three
const XSTOCK_MINTS: Record<string, string> = {
  NVDA: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
  AAPL: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
  TSLA: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
};

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Pyth feed IDs from Hermes (verified Sep 2026)
const PYTH_FEEDS: Record<string, string> = {
  NVDA: "b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593",
  AAPL: "49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688",
  TSLA: "16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1",
};

async function verifyMint(connection: Connection, ticker: string, mintAddress: string) {
  if (mintAddress.startsWith("TODO")) {
    console.log(`\n❌ ${ticker}: mint address not set — find it at https://xstocks.fi or Solana explorer`);
    return;
  }

  try {
    const mintPubkey = new PublicKey(mintAddress);
    const mintInfo = await getMint(connection, mintPubkey, "confirmed", TOKEN_2022_PROGRAM_ID);

    console.log(`\n✅ ${ticker} (${mintAddress})`);
    console.log(`   Decimals:     ${mintInfo.decimals}`);
    console.log(`   Supply:       ${mintInfo.supply}`);
    console.log(`   MintAuth:     ${mintInfo.mintAuthority?.toBase58() ?? "none"}`);
    console.log(`   FreezeAuth:   ${mintInfo.freezeAuthority?.toBase58() ?? "none"}`);
    console.log(`   IsInitialized: ${mintInfo.isInitialized}`);

    // Check for transfer hook extension
    const transferHook = getTransferHook(mintInfo);
    if (transferHook) {
      console.log(`\n   ⚠️  TRANSFER HOOK DETECTED`);
      console.log(`   Hook Program: ${transferHook.programId.toBase58()}`);
      console.log(`   ACTION REQUIRED: deposit.rs and claim.rs must pass`);
      console.log(`   remaining_accounts = [hook_program, ...hook_extra_accounts]`);
      console.log(`   See: https://spl.solana.com/token-2022/extensions#transfer-hook`);
    } else {
      console.log(`   Transfer Hook: none — standard Token-2022, no extra accounts needed`);
    }

    if (mintInfo.decimals !== 6) {
      console.log(`\n   ⚠️  DECIMALS ARE ${mintInfo.decimals}, NOT 6`);
      console.log(`   Update MIN_DEPOSIT_AMOUNT in constants.rs accordingly`);
      console.log(`   Update xstock_to_usd() assumption in math.rs if needed`);
    }
  } catch (err) {
    console.log(`\n❌ ${ticker}: error fetching mint — ${err}`);
    console.log(`   Is this a Token-2022 mint? Try TOKEN_PROGRAM_ID instead.`);
  }
}

async function verifyPythFeeds() {
  console.log("\n--- Pyth Feed Verification ---");
  for (const [ticker, feedId] of Object.entries(PYTH_FEEDS)) {
    try {
      const url = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}&encoding=base64`;
      const resp = await fetch(url);
      const data = await resp.json();
      const price = data.parsed?.[0]?.price;
      if (price) {
        const usdPrice = Number(price.price) * Math.pow(10, price.expo);
        console.log(`✅ ${ticker}: $${usdPrice.toFixed(2)} (feed ${feedId.slice(0, 12)}...)`);
      } else {
        console.log(`⚠️  ${ticker}: feed responded but no parsed price — check feed ID`);
      }
    } catch (err) {
      console.log(`❌ ${ticker}: Pyth fetch failed — ${err}`);
    }
  }
}

async function main() {
  const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

  console.log("=== Harvest Day-1 Verification ===\n");
  console.log("--- xStock Mint Verification (Token-2022) ---");

  for (const [ticker, mint] of Object.entries(XSTOCK_MINTS)) {
    await verifyMint(connection, ticker, mint);
  }

  await verifyPythFeeds();

  console.log("\n=== Verification complete ===");
  console.log("Update constants.rs with confirmed values before deploying.");
}

main().catch(console.error);
