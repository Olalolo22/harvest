use crate::errors::HarvestError;
use crate::state::{CycleState, VaultConfig};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

/// Settle an ITM cycle: settlement_price >= strike_price.
///
/// Keeper has already:
///   1. Called Jupiter API to swap vault's xStock → USDC (off-chain)
///   2. The USDC proceeds are in the keeper's own USDC ATA
///
/// This instruction:
///   - Accepts usdc_proceeds from keeper → vault_usdc_ata
///   - Records settlement metadata on the vault
///   - Transitions vault to Settled
///
/// ITM means xStock was "called away" at the strike price.
/// Users receive their proportional USDC share + premium at claim() time.
///
/// Transitions: CycleLocked → Settled
pub fn handler(
    ctx: Context<SettleItm>,
    settlement_price: i64,
    usdc_proceeds: u64,
) -> Result<()> {
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
        settlement_price >= vault.strike_price,
        HarvestError::NotItm
    );

    // Transfer USDC proceeds from keeper ATA → vault USDC ATA.
    // This uses regular SPL Token (USDC is not Token-2022).
    if usdc_proceeds > 0 {
        let cpi_accounts = Transfer {
            from: ctx.accounts.keeper_usdc_ata.to_account_info(),
            to: ctx.accounts.vault_usdc_ata.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_ctx =
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, usdc_proceeds)?;
    }

    vault.settlement_price = settlement_price;
    vault.was_otm = false;
    vault.itm_usdc_proceeds = usdc_proceeds;
    vault.cycle_state = CycleState::Settled;

    // Note: vault.total_xstock_deposited is NOT reset here.
    // It's reset progressively as users call claim() and their positions are cleared.
    // This allows proportional share calculation at claim() time.

    msg!(
        "ITM settlement: {} | cycle {} | settlement_price {} | strike {} | usdc_proceeds {} | {} positions pending",
        vault.ticker_str(),
        vault.current_cycle,
        settlement_price,
        vault.strike_price,
        usdc_proceeds,
        vault.pending_claims,
    );

    Ok(())
}

#[derive(Accounts)]
pub struct SettleItm<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [VaultConfig::SEED_PREFIX, vault_config.xstock_mint.as_ref()],
        bump = vault_config.bump,
        has_one = authority @ HarvestError::Unauthorized,
    )]
    pub vault_config: Account<'info, VaultConfig>,

    /// Keeper's USDC ATA — source of the Jupiter swap proceeds.
    #[account(
        mut,
        token::mint = vault_config.usdc_mint,
        token::authority = authority,
    )]
    pub keeper_usdc_ata: Account<'info, TokenAccount>,

    /// Vault's USDC ATA — receives proceeds from keeper.
    #[account(
        mut,
        address = vault_config.vault_usdc_ata,
    )]
    pub vault_usdc_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
