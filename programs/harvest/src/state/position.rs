use anchor_lang::prelude::*;

/// Lifecycle state of a user's position in a specific cycle.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum PositionState {
    /// Deposit confirmed. Cycle is running. Premium pending.
    Active,
    /// Cycle has been settled. User can call claim().
    ReadyToClaim,
    /// User has claimed their proceeds. Terminal state.
    Claimed,
}

/// One UserPosition per user per vault per cycle.
///
/// PDA seeds: [b"position", vault.key().as_ref(), owner.key().as_ref(), cycle.to_le_bytes().as_ref()]
///
/// Created on deposit(), updated on settle_otm/settle_itm (indirectly via vault state),
/// and marked Claimed on claim().
#[account]
#[derive(Debug)]
pub struct UserPosition {
    /// The wallet that deposited into this vault for this cycle.
    pub owner: Pubkey,

    /// The VaultConfig PDA this position belongs to.
    pub vault: Pubkey,

    /// The cycle number at time of deposit.
    /// Positions from a previous cycle cannot be claimed in the current cycle.
    pub cycle: u64,

    /// Amount of xStock tokens deposited, in xStock native base units.
    pub xstock_amount: u64,

    /// USD value of the deposit at lock_cycle time, in USDC base units (6 decimals).
    /// Computed from: xstock_amount × lock_price / PRICE_PRECISION.
    /// Set to 0 until lock_cycle fires; populated lazily by the keeper.
    /// Used to compute premium_usdc at claim time.
    pub deposit_value_usd: u64,

    /// Current lifecycle state.
    pub state: PositionState,

    /// Unix timestamp of the deposit.
    pub deposited_at: i64,

    /// PDA bump.
    pub bump: u8,
}

impl UserPosition {
    pub const SPACE: usize = 8   // discriminator
        + 32                      // owner
        + 32                      // vault
        + 8                       // cycle
        + 8                       // xstock_amount
        + 8                       // deposit_value_usd
        + 1                       // state (enum)
        + 8                       // deposited_at
        + 1;                      // bump

    pub const SEED_PREFIX: &'static [u8] = b"position";
}
