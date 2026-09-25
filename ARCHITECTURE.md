# Harvest Protocol — Architecture Specification

This document provides the canonical technical specification for the **Harvest** covered-call vault protocol on Solana. It details the on-chain account architecture, PDA derivations, state machine, financial mathematics, security invariants, and deployment parameters.

---

## 1. System Overview

Harvest implements non-custodial, weekly covered-call vaults for tokenized US equities (**xStocks** by Backed Finance) built on **Solana SPL Token-2022**. The protocol enables equity holders to generate recurring cashflow by writing fully collateralized out-of-the-money (OTM) call options against their holdings.

```
                    ┌─────────────────────────┐
                    │      xStock Holder      │
                    │   (NVDAx, AAPLx, TSLAx) │
                    └────────────┬────────────┘
                                 │
                     1. deposit(xStock, amount)
                                 │
                                 ▼
                     ┌────────────────────────┐
                     │    Harvest Program     │
                     │ (Anchor v0.30.1 Engine)│
                     └───────────┬────────────┘
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     │                           │                           │
2. Transfers collateral      3. Mints position       4. Keeper captures strike
     │                           │                           │
     ▼                           ▼                           ▼
┌───────────────────┐   ┌──────────────────┐   ┌───────────────────────────┐
│ Vault xStock ATA  │   │ UserPosition PDA │   │ Pyth Hermes Low-Latency   │
│ (Token-2022 Mint) │   │ (Per-Cycle State)│   │ Equity Price Feeds        │
└───────────────────┘   └──────────────────┘   └───────────────────────────┘
```

---

## 2. Program Accounts & PDA Derivation Map

All program state accounts are non-custodial, PDA-governed, and deterministically derived from the Harvest Program ID:  
`34Y7acmqWosmkfPJjqRUQzrHFdxmxpQezLSvgD9bLJJo`.

### 2.1 VaultConfig Account
The primary state account for each supported equity vault, controlling parameters, cycle counters, and token custody accounts.

- **Seed**: `[b"vault", xstock_mint.as_ref()]`
- **Bump**: Derived during `initialize` instruction.
- **Authority**: Designated keeper / protocol authority (restricted to cycle transitions: `lock_cycle` and `settle_*`).

```rust
#[account]
pub struct VaultConfig {
    pub vault_bump: u8,               // PDA bump seed (1 byte)
    pub authority: Pubkey,            // Keeper / Admin pubkey (32 bytes)
    pub xstock_mint: Pubkey,          // Token-2022 stock mint (32 bytes)
    pub usdc_mint: Pubkey,            // SPL USDC mint (32 bytes)
    pub vault_xstock_ata: Pubkey,     // Vault ATA holding xStock collateral (32 bytes)
    pub vault_usdc_ata: Pubkey,       // Vault ATA holding USDC premiums / proceeds (32 bytes)
    pub cycle_number: u64,            // Monotonically increasing epoch (8 bytes)
    pub state: VaultState,            // AcceptingDeposits | CycleLocked | Settled (1 byte)
    pub strike_price_usd: u64,        // Strike price in USD, scaled 10^6 (8 bytes)
    pub start_price_usd: u64,         // Pyth spot price at cycle lock, scaled 10^6 (8 bytes)
    pub settle_price_usd: u64,        // Pyth spot price at cycle settlement (8 bytes)
    pub total_deposits: u64,          // Total xStock tokens locked this cycle (8 bytes)
    pub total_premium_usdc: u64,      // Total USDC premium deposited for cycle (8 bytes)
    pub locked_at: i64,               // Unix timestamp when cycle locked (8 bytes)
    pub settle_after: i64,            // Unix timestamp when option expires (8 bytes)
}
```

### 2.2 UserPosition Account
Records individual depositor entitlements isolated to a specific cycle epoch.

- **Seed**: `[b"position", vault_config.key().as_ref(), user_authority.key().as_ref(), cycle_number.to_le_bytes().as_ref()]`

```rust
#[account]
pub struct UserPosition {
    pub user: Pubkey,                 // Depositor wallet address (32 bytes)
    pub shares: u64,                  // Deposited xStock raw amount in 8 decimals (8 bytes)
    pub claimed: bool,                // Re-entrancy / double-claim guard (1 byte)
    pub deposited_at: i64,            // Unix timestamp of deposit (8 bytes)
}
```

---

## 3. Instruction Lifecycle & State Machine

```
   ┌────────────────────────────────────────────────────────┐
   │                                                        │
   │               State: AcceptingDeposits                 │
   │                                                        │
   └───────────────────────────┬────────────────────────────┘
                               │
                lock_cycle(pyth_spot_price)
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                                                        │
   │                  State: CycleLocked                    │
   │              (7-Day Covered Call Active)               │
   │                                                        │
   └─────────────┬────────────────────────────┬─────────────┘
                 │                            │
   settle_otm (S_T < K)         settle_itm (S_T >= K)
                 │                            │
                 ▼                            ▼
   ┌────────────────────────┐   ┌───────────────────────────┐
   │    State: Settled      │   │      State: Settled       │
   │     (OTM Expired)      │   │       (ITM Swapped)       │
   └─────────────┬──────────┘   └─────────────┬─────────────┘
                 │                            │
                 └─────────────┬──────────────┘
                               │
                        claim(position)
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                                                        │
   │             User Receives Settlement Payout            │
   │         (OTM: Stock + Premium / ITM: USDC + Premium)   │
   │                                                        │
   └────────────────────────────────────────────────────────┘
```

### 3.1 Fully-Collateralized Runtime Invariants
The smart contract asserts runtime invariants before modifying state:
1. **Collateral Segregation**: Deposited xStock tokens remain inside `vault_xstock_ata` throughout the active option epoch. The keeper has zero authority to withdraw underlying principal.
2. **Deterministic Settlement Verification**:
   - `settle_otm`: Asserts `settlement_price_usd < strike_price_usd`. The underlying xStock ATA balance is marked unencumbered for user redemptions.
   - `settle_itm`: The keeper delivers the exact USDC proceeds equivalent to the strike value of the locked shares (`total_deposits × strike_price_usd`). The contract asserts `transferred_usdc >= required_usdc` before marking the vault `Settled`.
3. **Proportional Claims**: On ITM claims, user proceeds are calculated against `total_deposits` as snapshot at settlement time:
   $$\text{User USDC Share} = \frac{\text{User Shares} \times \text{Total ITM USDC Proceeds}}{\text{Total Deposits Locked}}$$

---

## 4. Financial Mathematics & Options Pricing

### 4.1 Strike Price Derivation
At cycle lock, the spot price $S_0$ is captured from the Pyth Hermes equity feed. The strike price $K$ is set according to the selected vault delta profile:

$$K = S_0 \times (1 + \alpha)$$

Where:
- $\alpha = 0.04$ for **Conservative** (+4% OTM)
- $\alpha = 0.08$ for **Balanced** (+8% OTM)
- $\alpha = 0.12$ for **Aggressive** (+12% OTM)

### 4.2 Weekly Yield Calculation
The upfront weekly option premium paid to depositors is derived using 128-bit safe arithmetic in `math.rs`:

$$\text{USDC Premium} = \left\lfloor \frac{\text{Shares} \times S_0 \times \text{Yield BPS}}{10^4 \times 10^8} \right\rfloor \times 10^6$$

- **Price Precision**: 6 decimals (`PRICE_PRECISION = 1_000_000`)
- **xStock Precision**: 8 decimals (Token-2022 base units)
- **USDC Precision**: 6 decimals (SPL base units)
- **Yield Precision**: Basis points ($100 \text{ BPS} = 1.0\%$)

---

## 5. Security Threat Model & Invariants

| Attack Vector | Anchor Runtime Mitigation |
|---|---|
| **Re-entrancy Attacks** | Solana's account ownership model forbids cross-contract reentrancy; state updates precede SPL token transfer CPIs. |
| **Price Manipulation** | Pyth Hermes oracle feeds are signed by the Pyth validator network with confidence intervals and publication timestamps. |
| **Premature Settlement** | Guarded by `require!(clock.unix_timestamp >= vault.settle_after, HarvestError::SettlementTimeNotReached)`. |
| **Double Claims** | Guarded by `require!(!position.claimed, HarvestError::AlreadyClaimed)` and immediate state mutation before transfer. |
| **Stuck Funds / Keeper Outage** | `settle_otm` and `claim` are permissionless once `settle_after` timestamp passes, ensuring funds are never permanently locked. |

---

## 6. Deployment Manifest & Asset Directory

### 6.1 Solana Devnet Deployment (Active Testing)
| Contract / Asset | Role | Address | Standard / Program |
|---|---|---|---|
| **Harvest Protocol Core** | Program ID | `34Y7acmqWosmkfPJjqRUQzrHFdxmxpQezLSvgD9bLJJo` | Anchor v0.30.1 |
| **VaultConfig PDA (xNVDA)** | State Account | `Gm2yabt5fCMBE6QpYjmt9hEY8nizYMdhqXc9moPG44Qz` | System Owned PDA |
| **xNVDA Test Mint** | Underlying Collateral | `EM5uTvQNpeTt4P1vRyfRdvtku42MytZjRsPG7KG4BRqV` | Token-2022 (8 decimals) |
| **Devnet USDC** | Settlement Token | `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr` | Standard SPL (6 decimals) |
| **Cycle 1 Settled Tx** | Verified Devnet Tx | `5wJaSBYp2Fd69kwqwp1At6n8vdTaRpvtQHvojGBp1MdwgC6wPmHe8zn4q39cK7oNmzk5KyavtHfaAf1kzQrSk6YY` | Solana Explorer |
| **Cycle 2 Lock Tx** | Verified Devnet Tx | `2pMaW8KFxzceMUaor1HqdByWvz1QCHLgUMC1fTzH3qaLbD4WrkBBNy6GVCceVezcDt8J5aMtNd2w5zT3AxDN4DbN` | Solana Explorer |

### 6.2 Target Mainnet Token-2022 Assets (Backed Finance)
| Asset | Ticker | Mainnet Mint Address | Decimals | Transfer Hook Status |
|---|---|---|:---:|:---:|
| **Apple xStock** | `AAPLx` | `XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp` | 8 | Inactive (Standard CPI) |
| **NVIDIA xStock** | `NVDAx` | `Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh` | 8 | Inactive (Standard CPI) |
| **Tesla xStock** | `TSLAx` | `XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB` | 8 | Inactive (Standard CPI) |

---

## 7. License
Harvest is open-source software licensed under the **Apache-2.0 License**.
