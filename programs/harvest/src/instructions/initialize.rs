use crate::constants::{MAX_PREMIUM_RATE_BPS, MAX_STRIKE_OFFSET_BPS};
use crate::errors::HarvestError;
use crate::state::{CycleState, VaultConfig};
use anchor_lang::prelude::*;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::{Mint, TokenAccount};

/// Initialize a new vault for a specific xStock.
///
/// Called once by the admin. After this, admin must fund vault_usdc_ata
/// with enough USDC to cover premium payments.
pub fn handler(
    ctx: Context<Initialize>,
    ticker: [u8; 8],
    strike_offset_bps: u16,
    premium_rate_bps: u16,
    cycle_duration_seconds: i64,
) -> Result<()> {
    require!(
        premium_rate_bps <= MAX_PREMIUM_RATE_BPS,
        HarvestError::PremiumRateTooHigh
    );
    require!(
        strike_offset_bps <= MAX_STRIKE_OFFSET_BPS,
        HarvestError::StrikeOffsetTooHigh
    );
    require!(cycle_duration_seconds > 0, HarvestError::InvalidCycleDuration);

    let vault = &mut ctx.accounts.vault_config;
    let clock = Clock::get()?;

    vault.authority = ctx.accounts.authority.key();
    vault.xstock_mint = ctx.accounts.xstock_mint.key();
    vault.ticker = ticker;
    vault.xstock_decimals = ctx.accounts.xstock_mint.decimals;
    vault.usdc_mint = ctx.accounts.usdc_mint.key();
    vault.vault_xstock_ata = ctx.accounts.vault_xstock_ata.key();
    vault.vault_usdc_ata = ctx.accounts.vault_usdc_ata.key();
    vault.strike_offset_bps = strike_offset_bps;
    vault.premium_rate_bps = premium_rate_bps;
    vault.current_cycle = 1;
    vault.cycle_state = CycleState::AcceptingDeposits;
    vault.strike_price = 0;
    vault.settlement_price = 0;
    vault.was_otm = false;
    vault.itm_usdc_proceeds = 0;
    vault.cycle_locked_at = clock.unix_timestamp;
    vault.settle_after = 0;
    vault.cycle_duration_seconds = cycle_duration_seconds;
    vault.total_xstock_deposited = 0;
    vault.pending_claims = 0;
    vault.total_premium_distributed = 0;
    vault.bump = ctx.bumps.vault_config;

    msg!(
        "Harvest vault initialized: {} | strike +{}bps | premium {}bps | cycle {}s",
        vault.ticker_str(),
        strike_offset_bps,
        premium_rate_bps,
        cycle_duration_seconds,
    );

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The xStock Token-2022 mint. Must be a Token-2022 mint.
    /// Verify this is the correct mint for the stock before calling.
    #[account(
        mint::token_program = token_program,
    )]
    pub xstock_mint: InterfaceAccount<'info, Mint>,

    /// USDC mint. Must be the mainnet USDC mint.
    #[account(
        mint::token_program = anchor_spl::token::Token::id(),
    )]
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    /// VaultConfig PDA. One per xStock mint.
    #[account(
        init,
        payer = authority,
        space = VaultConfig::SPACE,
        seeds = [VaultConfig::SEED_PREFIX, xstock_mint.key().as_ref()],
        bump,
    )]
    pub vault_config: Account<'info, VaultConfig>,

    /// Vault's Token-2022 ATA for xStock. Holds deposited tokens during cycle.
    #[account(
        init,
        payer = authority,
        token::mint = xstock_mint,
        token::authority = vault_config,
        token::token_program = token_program,
    )]
    pub vault_xstock_ata: InterfaceAccount<'info, TokenAccount>,

    /// Vault's USDC ATA. Admin must fund this with the premium reserve.
    #[account(
        init,
        payer = authority,
        token::mint = usdc_mint,
        token::authority = vault_config,
    )]
    pub vault_usdc_ata: InterfaceAccount<'info, TokenAccount>,

    /// Token-2022 program — required for xStock mint/ATAs.
    pub token_program: Program<'info, Token2022>,

    /// Regular SPL Token program — required for USDC ATA init.
    pub token_program_classic: Program<'info, anchor_spl::token::Token>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
