use crate::errors::HarvestError;
use crate::math::{compute_itm_share, compute_premium_usdc, xstock_to_usd};
use crate::state::{CycleState, PositionState, UserPosition, VaultConfig};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::{self, Mint, TokenAccount as InterfaceTokenAccount, TransferChecked};

/// Claim settlement proceeds after a cycle is settled.
///
/// OTM outcome: user receives xStock back + USDC premium
/// ITM outcome: user receives proportional USDC share + USDC premium
///
/// Premium is computed lazily here from vault.premium_rate_bps and position.deposit_value_usd.
/// If deposit_value_usd is 0 (position deposited after lock), premium uses xstock_amount × settlement_price.
///
/// After all positions are claimed, vault opens the next cycle (AcceptingDeposits).
pub fn handler(ctx: Context<Claim>) -> Result<()> {
    let vault = &ctx.accounts.vault_config;

    // Validate state
    require!(
        vault.cycle_state == CycleState::Settled,
        HarvestError::VaultNotSettled
    );

    let position = &ctx.accounts.user_position;
    require!(
        position.state == PositionState::Active,
        HarvestError::AlreadyClaimed
    );
    require!(
        position.cycle == vault.current_cycle,
        HarvestError::CycleMismatch
    );

    // -------------------------------------------------------------------------
    // Compute premium (lazy — uses settlement price if deposit_value_usd not set)
    // -------------------------------------------------------------------------
    let effective_deposit_value = if position.deposit_value_usd > 0 {
        position.deposit_value_usd
    } else {
        // Fallback: estimate using settlement price and xstock_amount
        xstock_to_usd(
            position.xstock_amount,
            vault.settlement_price,
            vault.xstock_decimals,
        )?
    };
    let premium_usdc = compute_premium_usdc(effective_deposit_value, vault.premium_rate_bps)?;

    // -------------------------------------------------------------------------
    // Verify vault has enough USDC for premium
    // -------------------------------------------------------------------------
    require!(
        ctx.accounts.vault_usdc_ata.amount >= premium_usdc,
        HarvestError::InsufficientPremiumReserve
    );

    // -------------------------------------------------------------------------
    // Build PDA signer seeds for vault_config
    // -------------------------------------------------------------------------
    let xstock_mint_key = vault.xstock_mint;
    let vault_bump = vault.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[
        VaultConfig::SEED_PREFIX,
        xstock_mint_key.as_ref(),
        &[vault_bump],
    ]];

    // -------------------------------------------------------------------------
    // Transfer based on OTM/ITM outcome
    // -------------------------------------------------------------------------
    if vault.was_otm {
        // OTM: return xStock tokens to user using Token-2022 transfer_checked
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.vault_xstock_ata.to_account_info(),
            mint: ctx.accounts.xstock_mint.to_account_info(),
            to: ctx.accounts.user_xstock_ata.to_account_info(),
            authority: ctx.accounts.vault_config.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program_2022.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token_interface::transfer_checked(cpi_ctx, position.xstock_amount, vault.xstock_decimals)?;
    } else {
        // ITM: send user's proportional USDC share from vault
        let user_usdc_share = compute_itm_share(
            position.xstock_amount,
            vault.total_xstock_deposited,
            vault.itm_usdc_proceeds,
        )?;
        if user_usdc_share > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.vault_usdc_ata.to_account_info(),
                to: ctx.accounts.user_usdc_ata.to_account_info(),
                authority: ctx.accounts.vault_config.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer_seeds,
            );
            token::transfer(cpi_ctx, user_usdc_share)?;
        }
    }

    // Transfer USDC premium to user
    if premium_usdc > 0 {
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_usdc_ata.to_account_info(),
            to: ctx.accounts.user_usdc_ata.to_account_info(),
            authority: ctx.accounts.vault_config.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::transfer(cpi_ctx, premium_usdc)?;
    }

    // -------------------------------------------------------------------------
    // Update state
    // -------------------------------------------------------------------------
    let position = &mut ctx.accounts.user_position;
    position.state = PositionState::Claimed;

    let vault = &mut ctx.accounts.vault_config;
    vault.total_premium_distributed = vault
        .total_premium_distributed
        .checked_add(premium_usdc)
        .ok_or(error!(HarvestError::MathOverflow))?;
    vault.pending_claims = vault
        .pending_claims
        .saturating_sub(1);

    // Reduce the vault's tracked xstock if OTM (tokens were returned)
    if vault.was_otm {
        vault.total_xstock_deposited = vault
            .total_xstock_deposited
            .saturating_sub(position.xstock_amount);
    }

    // -------------------------------------------------------------------------
    // Open next cycle if all positions have claimed
    // -------------------------------------------------------------------------
    if vault.pending_claims == 0 {
        vault.current_cycle = vault
            .current_cycle
            .checked_add(1)
            .ok_or(error!(HarvestError::MathOverflow))?;
        vault.cycle_state = CycleState::AcceptingDeposits;
        vault.strike_price = 0;
        vault.settlement_price = 0;
        vault.was_otm = false;
        vault.itm_usdc_proceeds = 0;
        vault.total_xstock_deposited = 0;

        msg!(
            "All positions claimed. {} vault opening cycle {}",
            vault.ticker_str(),
            vault.current_cycle,
        );
    }

    msg!(
        "Claim: {} | OTM={} | premium={} USDC | pending_claims={}",
        vault.ticker_str(),
        vault.was_otm,
        premium_usdc,
        vault.pending_claims,
    );

    Ok(())
}

#[derive(Accounts)]
pub struct Claim<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [VaultConfig::SEED_PREFIX, vault_config.xstock_mint.as_ref()],
        bump = vault_config.bump,
    )]
    pub vault_config: Account<'info, VaultConfig>,

    /// xStock mint — needed for Token-2022 transfer_checked in OTM path.
    #[account(
        address = vault_config.xstock_mint,
        mint::token_program = token_program_2022,
    )]
    pub xstock_mint: InterfaceAccount<'info, Mint>,

    /// Vault's xStock ATA — source for OTM returns.
    #[account(
        mut,
        address = vault_config.vault_xstock_ata,
    )]
    pub vault_xstock_ata: InterfaceAccount<'info, InterfaceTokenAccount>,

    /// User's xStock ATA — receives xStock on OTM settlement.
    #[account(
        mut,
        token::mint = xstock_mint,
        token::authority = owner,
        token::token_program = token_program_2022,
    )]
    pub user_xstock_ata: InterfaceAccount<'info, InterfaceTokenAccount>,

    /// Vault's USDC ATA — source for premium and ITM proceeds.
    #[account(
        mut,
        address = vault_config.vault_usdc_ata,
    )]
    pub vault_usdc_ata: Account<'info, TokenAccount>,

    /// User's USDC ATA — receives premium (and ITM proceeds if ITM).
    #[account(
        mut,
        token::mint = vault_config.usdc_mint,
        token::authority = owner,
    )]
    pub user_usdc_ata: Account<'info, TokenAccount>,

    /// UserPosition PDA for this user+vault+cycle.
    #[account(
        mut,
        seeds = [
            UserPosition::SEED_PREFIX,
            vault_config.key().as_ref(),
            owner.key().as_ref(),
            vault_config.current_cycle.to_le_bytes().as_ref(),
        ],
        bump = user_position.bump,
        has_one = owner,
        constraint = user_position.vault == vault_config.key() @ HarvestError::CycleMismatch,
    )]
    pub user_position: Account<'info, UserPosition>,

    /// Token-2022 program for xStock transfers.
    pub token_program_2022: Program<'info, Token2022>,
    /// Regular SPL Token program for USDC transfers.
    pub token_program: Program<'info, Token>,
}
