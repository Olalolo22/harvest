# Harvest Protocol — Architecture Specification

## 1. System Overview
Harvest is a decentralized covered call vault protocol built on the **Solana** blockchain utilizing the **SPL Token-2022** standard. It enables holders of tokenized US equities (**xStocks** by Backed Finance) to generate yield by writing fully collateralized weekly covered call options.

```
                    ┌─────────────────────────┐
                    │      xStock Holder      │
                    │   (NVDAx, AAPLx, TSLAx) │
                    └────────────┬────────────┘
                                 │
                     1. deposit(xStock, shares)
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

## 2. Program Accounts & PDA Seed Map

All program states are strictly non-custodial and derived deterministically from the program ID `34Y7acmqWosmkfPJjqRUQzrHFdxmxpQezLSvgD9bLJJo`.

### 2.1 VaultConfig Account
The primary state account for each supported equity vault.

- **Seed**: `[b"vault", xstock_mint.as_ref()]`
- **Bump**: Computed on `initialize` instruction.
- **Authority**: Keeper / Protocol admin (can only execute `lock_cycle` and `settle_*`).

```rust
#[account]
pub struct VaultConfig {
    pub vault_bump: u8,
    pub authority: Pubkey,
    pub xstock_mint: Pubkey,
    pub usdc_mint: Pubkey,
    pub vault_xstock_ata: Pubkey,
    pub vault_usdc_ata: Pubkey,
    pub cycle_number: u64,
    pub state: VaultState,
    pub strike_price_usd: u64,       // Scaled 10^6
    pub start_price_usd: u64,        // Scaled 10^6
    pub settle_price_usd: u64,       // Scaled 10^6
    pub total_deposits: u64,         // Raw Token-2022 units (8 decimals)
    pub total_premium_usdc: u64,     // Raw USDC units (6 decimals)
    pub locked_at: i64,              // Unix timestamp
    pub settle_after: i64,           // Unix timestamp
}
```

### 2.2 UserPosition Account
Records the individual user's deposit in an active or historical cycle.

- **Seed**: `[b"position", vault.key().as_ref(), user.key().as_ref(), cycle_number.to_le_bytes().as_ref()]`

```rust
#[account]
pub struct UserPosition {
    pub user: Pubkey,
    pub shares: u64,
    pub claimed: bool,
    pub deposited_at: i64,
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
   │                     State: Locked                      │
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
   │            User Receives Collateral + USDC             │
   │                                                        │
   └────────────────────────────────────────────────────────┘
```

---

## 4. Financial Mathematics & Options Pricing

### 4.1 Strike Price Derivation
At the moment of cycle locking, the spot price $S_0$ is fetched from Pyth Hermes. The strike price $K$ is established according to the vault's target delta:

$$K = S_0 \times (1 + \alpha)$$

Where:
- $\alpha = 0.04$ for **Conservative** (+4% OTM)
- $\alpha = 0.08$ for **Balanced** (+8% OTM)
- $\alpha = 0.12$ for **Aggressive** (+12% OTM)

### 4.2 Weekly Yield Calculation
The fixed weekly premium $C_0$ paid to depositors is derived using 128-bit safe arithmetic:

$$\text{USDC Yield} = \left\lfloor \frac{\text{Shares} \times S_0 \times \text{Yield BPS}}{10^4 \times 10^8} \right\rfloor \times 10^6$$

---

## 5. Security Threat Model & Invariants

| Attack Vector | Mitigation in Harvest Program |
|---|---|
| **Re-entrancy Attacks** | Solana's account ownership model forbids cross-contract reentrancy; state updates precede SPL token transfers. |
| **Price Manipulation** | Off-chain Pyth Hermes oracle feeds are signed by the Pyth validator network with confidence intervals. |
| **Premature Settlement** | Enforced by `require!(clock.unix_timestamp >= vault.settle_after, HarvestError::SettlementTimeNotReached)`. |
| **Double Claims** | Guarded by `require!(!position.claimed, HarvestError::AlreadyClaimed)` and state mutation prior to transfer. |
| **Stuck Funds / Freeze Risk** | In case of keeper outage, `settle_otm` is permissionless after an extended delay, ensuring funds are never permanently locked. |

---

## 6. Live Devnet Deployment Manifest

- **Harvest Core Program ID**: `34Y7acmqWosmkfPJjqRUQzrHFdxmxpQezLSvgD9bLJJo`
- **Network**: Solana Devnet
- **Commit**: `design-v2`
- **Build**: Anchor 0.30.1 / Solana CLI 1.18.26
