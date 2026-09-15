use crate::errors::HarvestError;
use crate::state::{CycleState, VaultConfig};
use anchor_lang::prelude::*;

/// Settle an OTM cycle: settlement_price < strike_price.
///
/// Called by the keeper after the settle_after timestamp has passed,
/// with the Pyth settlement price fetched off-chain from Hermes.
///
/// xStock tokens stay in vault_xstock_ata until each user calls claim().
/// USDC premium is distributed per-user at claim() time (lazy computation).
///
/// Transitions: CycleLocked → Settled
pub fn handler(ctx: Context<SettleOtm>, settlement_price: i64) -> Result<()> {
    require!(settlement_price > 0, HarvestError::InvalidPrice);

    let vault = &mut ctx.accounts.vault_config;
    let clock = Clock::get()?;

    require!(
        vault.cycle_state == CycleState::CycleLocked,
        HarvestError::CycleNotLocked
    );
    require!(
        clock.unix_timestamp >= vault.settle_after,
        HarvestError::TooEarlyToSettle
    );
    require!(
        settlement_price < vault.strike_price,
        HarvestError::NotOtm
    );

    vault.settlement_price = settlement_price;
    vault.was_otm = true;
    vault.itm_usdc_proceeds = 0;
    vault.cycle_state = CycleState::Settled;

    msg!(
        "OTM settlement: {} | cycle {} | settlement_price {} | strike {} | {} positions pending claim",
        vault.ticker_str(),
        vault.current_cycle,
        settlement_price,
        vault.strike_price,
        vault.pending_claims,
    );

    Ok(())
}

#[derive(Accounts)]
pub struct SettleOtm<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [VaultConfig::SEED_PREFIX, vault_config.xstock_mint.as_ref()],
        bump = vault_config.bump,
        has_one = authority @ HarvestError::Unauthorized,
    )]
    pub vault_config: Account<'info, VaultConfig>,
}
