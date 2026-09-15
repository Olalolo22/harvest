use crate::errors::HarvestError;
use crate::math::compute_strike;
use crate::state::{CycleState, VaultConfig};
use anchor_lang::prelude::*;

/// Lock the current cycle and set the weekly strike price.
///
/// Called by the keeper (authority) with the current Pyth price fetched
/// off-chain from Hermes API. No on-chain Pyth CPI — keeper is the oracle bridge.
///
/// Transitions: AcceptingDeposits → CycleLocked
pub fn handler(ctx: Context<LockCycle>, current_price: i64) -> Result<()> {
    require!(current_price > 0, HarvestError::InvalidPrice);

    let vault = &mut ctx.accounts.vault_config;

    require!(
        vault.cycle_state == CycleState::AcceptingDeposits,
        HarvestError::VaultNotAcceptingDeposits
    );

    let clock = Clock::get()?;
    let strike = compute_strike(current_price, vault.strike_offset_bps)?;

    vault.strike_price = strike;
    vault.cycle_locked_at = clock.unix_timestamp;
    vault.settle_after = clock
        .unix_timestamp
        .checked_add(vault.cycle_duration_seconds)
        .ok_or(error!(HarvestError::MathOverflow))?;
    vault.cycle_state = CycleState::CycleLocked;

    msg!(
        "Cycle locked: {} | cycle {} | current_price {} | strike {} | settles at {}",
        vault.ticker_str(),
        vault.current_cycle,
        current_price,
        strike,
        vault.settle_after,
    );

    Ok(())
}

#[derive(Accounts)]
pub struct LockCycle<'info> {
    /// Only the vault authority (keeper) can lock cycles.
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [VaultConfig::SEED_PREFIX, vault_config.xstock_mint.as_ref()],
        bump = vault_config.bump,
        has_one = authority @ HarvestError::Unauthorized,
    )]
    pub vault_config: Account<'info, VaultConfig>,
}
