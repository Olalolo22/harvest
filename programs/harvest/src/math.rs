use crate::constants::{BPS_DIVISOR, PRICE_PRECISION};
use crate::errors::HarvestError;
use anchor_lang::prelude::*;

/// Compute the OTM strike price.
///
/// strike = price × (BPS_DIVISOR + offset_bps) / BPS_DIVISOR
///
/// price is in USD with PRICE_PRECISION decimal places (i.e. $186.50 = 186_500_000).
/// Returns strike in the same units.
pub fn compute_strike(price: i64, strike_offset_bps: u16) -> Result<i64> {
    let numerator = price
        .checked_mul(BPS_DIVISOR as i64 + strike_offset_bps as i64)
        .ok_or(error!(HarvestError::MathOverflow))?;
    let strike = numerator
        .checked_div(BPS_DIVISOR as i64)
        .ok_or(error!(HarvestError::MathOverflow))?;
    Ok(strike)
}

/// Compute the USDC premium for a position.
///
/// premium_usdc = deposit_value_usd × premium_rate_bps / BPS_DIVISOR
///
/// deposit_value_usd is in USDC base units (6 decimals).
/// Returns USDC base units.
pub fn compute_premium_usdc(deposit_value_usd: u64, premium_rate_bps: u16) -> Result<u64> {
    let premium = (deposit_value_usd as u128)
        .checked_mul(premium_rate_bps as u128)
        .and_then(|v| v.checked_div(BPS_DIVISOR as u128))
        .ok_or(error!(HarvestError::MathOverflow))?;
    Ok(premium as u64)
}

/// Convert xStock amount to USD value using Pyth price.
///
/// price is in USD × PRICE_PRECISION (6 decimals).
/// xstock_amount is in xStock base units (assumed 6 decimals — verify on Day 1).
/// Returns USDC base units (6 decimals).
pub fn xstock_to_usd(xstock_amount: u64, price: i64, xstock_decimals: u8) -> Result<u64> {
    // Normalise xStock to 6-decimal base, then multiply by price
    let xstock_scaled: u128 = if xstock_decimals >= 6 {
        (xstock_amount as u128)
            .checked_div(10u128.pow((xstock_decimals - 6) as u32))
            .ok_or(error!(HarvestError::MathOverflow))?
    } else {
        (xstock_amount as u128)
            .checked_mul(10u128.pow((6 - xstock_decimals) as u32))
            .ok_or(error!(HarvestError::MathOverflow))?
    };

    // price has PRICE_PRECISION decimals; result should be in USDC (6 decimals)
    let value = xstock_scaled
        .checked_mul(price as u128)
        .and_then(|v| v.checked_div(PRICE_PRECISION as u128))
        .ok_or(error!(HarvestError::MathOverflow))?;

    Ok(value as u64)
}

/// Compute a user's proportional share of ITM USDC proceeds.
///
/// user_share = (user_xstock_amount × total_usdc_proceeds) / total_xstock_deposited
pub fn compute_itm_share(
    user_xstock_amount: u64,
    total_xstock_deposited: u64,
    total_usdc_proceeds: u64,
) -> Result<u64> {
    if total_xstock_deposited == 0 {
        return Ok(0);
    }
    let share = (user_xstock_amount as u128)
        .checked_mul(total_usdc_proceeds as u128)
        .and_then(|v| v.checked_div(total_xstock_deposited as u128))
        .ok_or(error!(HarvestError::MathOverflow))?;
    Ok(share as u64)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_strike_3pct() {
        // $186.00 price, 300 bps (3%) offset → $191.58
        let price = 186_000_000i64; // $186.00 with 6 decimal precision
        let strike = compute_strike(price, 300).unwrap();
        assert_eq!(strike, 191_580_000); // $191.58
    }

    #[test]
    fn test_compute_premium_1_5pct() {
        // $1860 deposit, 150 bps (1.5%) → $27.90
        let deposit_value = 1_860_000_000u64; // $1860.00 in USDC base units (6 decimals)
        let premium = compute_premium_usdc(deposit_value, 150).unwrap();
        assert_eq!(premium, 27_900_000); // $27.90
    }

    #[test]
    fn test_itm_share_proportional() {
        // User has 1/3 of deposits, total proceeds = $3000 → user gets $1000
        let share = compute_itm_share(10, 30, 3_000_000_000).unwrap();
        assert_eq!(share, 1_000_000_000);
    }
}
