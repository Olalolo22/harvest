use anchor_lang::prelude::*;

#[error_code]
pub enum HarvestError {
    #[msg("Vault is not currently accepting deposits")]
    VaultNotAcceptingDeposits,

    #[msg("Cycle is not locked — cannot settle yet")]
    CycleNotLocked,

    #[msg("Settlement window has not opened yet — too early to settle")]
    TooEarlyToSettle,

    #[msg("OTM condition not met — settlement price is at or above strike")]
    NotOtm,

    #[msg("ITM condition not met — settlement price is below strike")]
    NotItm,

    #[msg("Position cycle does not match current vault cycle")]
    CycleMismatch,

    #[msg("Position has already been claimed")]
    AlreadyClaimed,

    #[msg("Position is not ready to claim — vault not settled yet")]
    VaultNotSettled,

    #[msg("Deposit amount must be greater than zero")]
    ZeroDepositAmount,

    #[msg("Deposit amount is below the minimum allowed")]
    DepositBelowMinimum,

    #[msg("USDC premium reserve is insufficient — admin must top up vault_usdc_ata")]
    InsufficientPremiumReserve,

    #[msg("Premium rate exceeds the maximum allowed (1000 bps = 10%)")]
    PremiumRateTooHigh,

    #[msg("Strike offset exceeds the maximum allowed (2000 bps = 20%)")]
    StrikeOffsetTooHigh,

    #[msg("Arithmetic overflow in price or premium calculation")]
    MathOverflow,

    #[msg("Price passed by keeper is non-positive — invalid Pyth reading")]
    InvalidPrice,

    #[msg("Cycle duration must be positive")]
    InvalidCycleDuration,

    #[msg("Caller is not the vault authority")]
    Unauthorized,
}
