use crate::constants::MIN_DEPOSIT_AMOUNT;
use crate::errors::HarvestError;
use crate::state::{CycleState, UserPosition, PositionState, VaultConfig};
use anchor_lang::prelude::*;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TransferChecked};

/// Deposit xStock tokens into the vault for the current cycle.
///
/// Creates a UserPosition PDA for this user+vault+cycle combination.
/// Uses transfer_checked (not transfer) for Token-2022 safety.
pub fn handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount >= MIN_DEPOSIT_AMOUNT, HarvestError::DepositBelowMinimum);
    require!(amount > 0, HarvestError::ZeroDepositAmount);

    // Read the values we need from vault before taking a mutable borrow.
    let vault_key = ctx.accounts.vault_config.key();
    let vault_decimals = ctx.accounts.vault_config.xstock_decimals;
    let vault_current_cycle;
    let vault_ticker;
    {
        let vault = &mut ctx.accounts.vault_config;
        require!(
            vault.cycle_state == CycleState::AcceptingDeposits,
            HarvestError::VaultNotAcceptingDeposits
        );

        // Transfer xStock from user → vault using Token-2022 transfer_checked.
        // transfer_checked is REQUIRED for Token-2022 mints (not transfer).
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.user_xstock_ata.to_account_info(),
            mint: ctx.accounts.xstock_mint.to_account_info(),
            to: ctx.accounts.vault_xstock_ata.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token_interface::transfer_checked(cpi_ctx, amount, vault_decimals)?;

        // Update vault totals.
        vault.total_xstock_deposited = vault
            .total_xstock_deposited
            .checked_add(amount)
            .ok_or(error!(HarvestError::MathOverflow))?;
        vault.pending_claims = vault
            .pending_claims
            .checked_add(1)
            .ok_or(error!(HarvestError::MathOverflow))?;
        vault_current_cycle = vault.current_cycle;
        vault_ticker = vault.ticker_str();
    }

    // Initialise the user position (vault borrow has ended above).
    let position = &mut ctx.accounts.user_position;
    let clock = Clock::get()?;
    position.owner = ctx.accounts.owner.key();
    position.vault = vault_key;
    position.cycle = vault_current_cycle;
    position.xstock_amount = amount;
    position.deposit_value_usd = 0; // Set at lock_cycle by keeper
    position.state = PositionState::Active;
    position.deposited_at = clock.unix_timestamp;
    position.bump = ctx.bumps.user_position;

    msg!(
        "Deposit: {} xStock ({} base units) into {} vault, cycle {}",
        amount,
        vault_ticker,
        amount,
        vault_current_cycle,
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    /// The vault for this xStock.
    #[account(
        mut,
        seeds = [VaultConfig::SEED_PREFIX, vault_config.xstock_mint.as_ref()],
        bump = vault_config.bump,
    )]
    pub vault_config: Account<'info, VaultConfig>,

    /// The xStock Token-2022 mint — needed for transfer_checked decimals.
    #[account(
        address = vault_config.xstock_mint,
        mint::token_program = token_program,
    )]
    pub xstock_mint: InterfaceAccount<'info, Mint>,

    /// User's xStock ATA. Must hold at least `amount` tokens.
    #[account(
        mut,
        token::mint = xstock_mint,
        token::authority = owner,
        token::token_program = token_program,
    )]
    pub user_xstock_ata: InterfaceAccount<'info, TokenAccount>,

    /// Vault's xStock ATA. Receives the deposited tokens.
    #[account(
        mut,
        address = vault_config.vault_xstock_ata,
    )]
    pub vault_xstock_ata: InterfaceAccount<'info, TokenAccount>,

    /// UserPosition PDA — one per user per vault per cycle.
    #[account(
        init,
        payer = owner,
        space = UserPosition::SPACE,
        seeds = [
            UserPosition::SEED_PREFIX,
            vault_config.key().as_ref(),
            owner.key().as_ref(),
            vault_config.current_cycle.to_le_bytes().as_ref(),
        ],
        bump,
    )]
    pub user_position: Account<'info, UserPosition>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}
