/// USDC mint address on Solana mainnet.
pub const USDC_MINT: &str = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/// Maximum premium rate the admin can configure (10% = 1000 bps).
pub const MAX_PREMIUM_RATE_BPS: u16 = 1_000;

/// Maximum OTM strike offset the admin can configure (20% = 2000 bps).
pub const MAX_STRIKE_OFFSET_BPS: u16 = 2_000;

/// Minimum deposit in xStock base units.
/// xStock mints use 8 DECIMALS (verified Sep 15 2026 via spl-token display).
/// 1.0 xStock = 100_000_000 base units.
pub const MIN_DEPOSIT_AMOUNT: u64 = 100_000_000;

/// Price precision divisor. All USD values stored with 6 decimal places.
pub const PRICE_PRECISION: u64 = 1_000_000;

/// Basis points divisor.
pub const BPS_DIVISOR: u64 = 10_000;

// ---------------------------------------------------------------------------
// xStock mint addresses (verified Sep 15 2026 via spl-token display mainnet)
// All are Token-2022 mints with 8 decimals.
// Transfer hook extension exists but programId=null (inactive) — no
// remaining_accounts needed for transfers.
// scaledUiAmountConfig multiplier embeds dividend reinvestment (~1.002x);
// vault works in raw on-chain amounts, UI layer should display multiplied value.
// ---------------------------------------------------------------------------

/// AAPLx — "Apple xStock" — verified ✅
pub const XAAPL_MINT: &str = "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp";

/// NVDAx — "NVIDIA xStock" — verified ✅ Sep 15 2026
pub const XNVDA_MINT: &str = "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh";

/// TSLAx — "Tesla xStock" — verified ✅ Sep 15 2026
pub const XTSLA_MINT: &str = "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB";

// ---------------------------------------------------------------------------
// Pyth price feed IDs for US equities (verified from Hermes API Sep 2026).
// Feed IDs as byte arrays for on-chain use. Keeper fetches price off-chain
// from Pyth Hermes and passes price as instruction argument — no on-chain CPI.
// ---------------------------------------------------------------------------
//
// NVDA: Equity.US.NVDA/USD
// pub const PYTH_NVDA_FEED_ID: &str =
//     "b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593";
//
// AAPL: Equity.US.AAPL/USD
// pub const PYTH_AAPL_FEED_ID: &str =
//     "49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688";
//
// TSLA: Equity.US.TSLA/USD
// pub const PYTH_TSLA_FEED_ID: &str =
//     "16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1";
