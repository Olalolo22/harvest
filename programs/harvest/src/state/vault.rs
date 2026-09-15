use anchor_lang::prelude::*;

/// Lifecycle state of a vault's weekly option cycle.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum CycleState {
    /// Vault is accepting deposits. Current week's cycle is open.
    AcceptingDeposits,
    /// Cycle is locked. Strike is set. No new deposits. Awaiting settlement time.
    CycleLocked,
    /// Cycle has been settled by the keeper. Users may now call claim().
    Settled,
}

/// Per-vault configuration. One account per supported xStock.
///
/// PDA seeds: [b"vault_config", xstock_mint.key().as_ref()]
/// Authority (admin/keeper) controls lock_cycle and settle_* instructions.
#[account]
#[derive(Debug)]
pub struct VaultConfig {
    /// Admin authority — can lock cycles and trigger settlement.
    pub authority: Pubkey,

    /// The xStock Token-2022 mint (e.g. xNVDA).
    /// Verify this is the correct Token-2022 mint before deploying.
    pub xstock_mint: Pubkey,

    /// Human-readable ticker stored as fixed-size bytes.
    /// e.g. "NVDA\0\0\0\0" or "AAPL\0\0\0\0"
    /// Use ticker_str() helper to convert to &str.
    pub ticker: [u8; 8],

    /// Decimal places of the xStock Token-2022 mint.
    /// MUST match the on-chain mint's decimals field.
    /// Verify on Day 1 via `spl-token display <MINT>`.
    pub xstock_decimals: u8,

    /// USDC mint.
    pub usdc_mint: Pubkey,

    /// Vault's ATA for xStock — holds deposited tokens during the cycle.
    /// This ATA is owned by the vault_config PDA.
    pub vault_xstock_ata: Pubkey,

    /// Vault's ATA for USDC — holds the premium reserve.
    /// Admin must fund this before each cycle.
    pub vault_usdc_ata: Pubkey,

    /// OTM strike offset in basis points above the current price.
    /// e.g. 300 = 3% OTM (strike = price × 1.03)
    pub strike_offset_bps: u16,

    /// Weekly premium rate in basis points of the deposit USD value.
    /// e.g. 150 = 1.50% weekly premium (simulated market maker for V1).
    pub premium_rate_bps: u16,

    /// Monotonically increasing cycle counter.
    /// Incremented at the start of each new AcceptingDeposits phase.
    pub current_cycle: u64,

    /// Current lifecycle state of the vault.
    pub cycle_state: CycleState,

    /// Strike price for the active cycle. Set when lock_cycle is called.
    /// USD with 6 decimal precision (PRICE_PRECISION).
    /// e.g. $191.58 → 191_580_000
    /// 0 when vault is AcceptingDeposits.
    pub strike_price: i64,

    /// Settlement price recorded at settle_otm/settle_itm time.
    /// 0 until settlement is complete.
    pub settlement_price: i64,

    /// Whether the settled cycle was OTM. Only valid after Settled.
    pub was_otm: bool,

    /// Total USDC proceeds from Jupiter swap during ITM settlement.
    /// Only valid after settle_itm. 0 for OTM cycles.
    pub itm_usdc_proceeds: u64,

    /// Unix timestamp when lock_cycle was called.
    pub cycle_locked_at: i64,

    /// Unix timestamp after which settlement is allowed.
    /// = cycle_locked_at + cycle_duration_seconds
    pub settle_after: i64,

    /// Cycle duration in seconds.
    /// Demo: 300 (5 min). Production: 604800 (7 days / weekly Friday-to-Friday).
    pub cycle_duration_seconds: i64,

    /// Total xStock tokens currently held in vault across all active positions.
    pub total_xstock_deposited: u64,

    /// Number of positions that have deposited in the current cycle
    /// but not yet claimed. Used to track when it's safe to open the next cycle.
    pub pending_claims: u32,

    /// Running total of USDC premium distributed across all historical cycles.
    pub total_premium_distributed: u64,

    /// PDA bump.
    pub bump: u8,
}

impl VaultConfig {
    pub const SPACE: usize = 8   // discriminator
        + 32                      // authority
        + 32                      // xstock_mint
        + 8                       // ticker
        + 1                       // xstock_decimals
        + 32                      // usdc_mint
        + 32                      // vault_xstock_ata
        + 32                      // vault_usdc_ata
        + 2                       // strike_offset_bps
        + 2                       // premium_rate_bps
        + 8                       // current_cycle
        + 1                       // cycle_state (enum)
        + 8                       // strike_price
        + 8                       // settlement_price
        + 1                       // was_otm
        + 8                       // itm_usdc_proceeds
        + 8                       // cycle_locked_at
        + 8                       // settle_after
        + 8                       // cycle_duration_seconds
        + 8                       // total_xstock_deposited
        + 4                       // pending_claims
        + 8                       // total_premium_distributed
        + 1;                      // bump

    pub const SEED_PREFIX: &'static [u8] = b"vault_config";

    /// Return the ticker as a &str, stripping null bytes.
    pub fn ticker_str(&self) -> &str {
        let end = self.ticker.iter().position(|&b| b == 0).unwrap_or(8);
        std::str::from_utf8(&self.ticker[..end]).unwrap_or("??")
    }
}
