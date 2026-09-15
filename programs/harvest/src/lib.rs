use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod math;
pub mod state;

use instructions::*;

declare_id!("34Y7acmqWosmkfPJjqRUQzrHFdxmxpQezLSvgD9bLJJo");

#[program]
pub mod harvest {
    use super::*;

    /// Create a new vault for a specific xStock.
    /// Called once per supported stock by the admin authority.
    /// Caller must separately fund vault_usdc_ata with the premium reserve.
    pub fn initialize(
        ctx: Context<Initialize>,
        ticker: [u8; 8],
        strike_offset_bps: u16,
        premium_rate_bps: u16,
        cycle_duration_seconds: i64,
    ) -> Result<()> {
        instructions::initialize::handler(
            ctx,
            ticker,
            strike_offset_bps,
            premium_rate_bps,
            cycle_duration_seconds,
        )
    }

    /// Deposit xStock tokens into the vault for the current cycle.
    /// Creates a UserPosition PDA tracking the deposit.
    /// Vault must be in AcceptingDeposits state.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handler(ctx, amount)
    }

    /// Lock the current cycle and set the weekly strike price.
    /// Called by the keeper/authority with the current Pyth price.
    /// Transitions vault from AcceptingDeposits → CycleLocked.
    pub fn lock_cycle(ctx: Context<LockCycle>, current_price: i64) -> Result<()> {
        instructions::lock_cycle::handler(ctx, current_price)
    }

    /// Settle an OTM (out-of-the-money) cycle.
    /// settlement_price < strike_price.
    /// Transitions vault to Settled. Users can now call claim().
    /// xStock tokens remain in vault ATA until each user calls claim().
    pub fn settle_otm(ctx: Context<SettleOtm>, settlement_price: i64) -> Result<()> {
        instructions::settle_otm::handler(ctx, settlement_price)
    }

    /// Settle an ITM (in-the-money) cycle.
    /// settlement_price >= strike_price.
    /// Keeper has already swapped xStock → USDC via Jupiter and holds usdc_proceeds.
    /// This instruction accepts the USDC proceeds and marks the vault Settled.
    pub fn settle_itm(
        ctx: Context<SettleItm>,
        settlement_price: i64,
        usdc_proceeds: u64,
    ) -> Result<()> {
        instructions::settle_itm::handler(ctx, settlement_price, usdc_proceeds)
    }

    /// Claim settlement proceeds after a cycle has been settled.
    /// OTM: returns xStock + USDC premium.
    /// ITM: returns proportional USDC share + USDC premium.
    /// Opens the next cycle (AcceptingDeposits) if this is the last pending claim.
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        instructions::claim::handler(ctx)
    }
}
