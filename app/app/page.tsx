"use client";

import { useState } from "react";
import styles from "./page.module.css";
import ConnectWalletButton from "./components/ConnectWalletButton";
import VaultModal from "./components/VaultModal";

interface VaultItem {
  symbol: string;
  name: string;
  color: string;
  price: string;
  premium: string;
  strike: string;
  cycle: number;
  status: string;
  mint: string;
}

const vaults: VaultItem[] = [
  {
    symbol: "xNVDA",
    name: "NVIDIA (Live Devnet)",
    color: "#76b900",
    price: "$213.90",
    premium: "8.4%",
    strike: "$220.32",
    cycle: 2,
    status: "Active (Locked)",
    mint: "EM5uTvQNpeTt4P1vRyfRdvtku42MytZjRsPG7KG4BRqV",
  },
  {
    symbol: "xAAPL",
    name: "Apple",
    color: "#9ca3af",
    price: "$228.71",
    premium: "6.8%",
    strike: "$235.50",
    cycle: 1,
    status: "Open",
    mint: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
  },
  {
    symbol: "xTSLA",
    name: "Tesla",
    color: "#e82127",
    price: "$441.62",
    premium: "10.2%",
    strike: "$455.00",
    cycle: 1,
    status: "Open",
    mint: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
  },
];

export default function Home() {
  const [selectedVault, setSelectedVault] = useState<VaultItem | null>(null);

  return (
    <main className={styles.siteShell}>
      <nav className={styles.nav} aria-label="Main navigation">
        <a href="#top" className={styles.brand}>
          <span className={styles.brandMark}>H</span>
          <span>harvest</span>
        </a>
        <div className={styles.navLinks}>
          <a href="#how-it-works">Our technology</a>
          <a href="#vaults">Vaults</a>
          <a href="#risks">Mission</a>
        </div>
        <ConnectWalletButton />
      </nav>

      <section className={styles.hero} id="top">
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}><span className={styles.liveDot} /> Automated option vaults · Solana mainnet</div>
          <h1>Automated covered-call<br /><em>yield vaults.</em></h1>
          <p className={styles.heroText}>Bringing programmable yield generation to tokenized equities on Solana.</p>
          <div className={styles.heroActions}>
            <a href="#vaults" className={styles.primaryButton}>Explore vaults <span aria-hidden="true">→</span></a>
            <a href="#how-it-works" className={styles.textButton}>See how it works <span aria-hidden="true">↓</span></a>
          </div>
          <div className={styles.trustRow}><span>Powered by</span><strong>Solana</strong><span className={styles.trustDivider} /> <span>Prices by</span><strong className={styles.pyth}>Pyth</strong></div>
        </div>
        <div className={styles.heroVisual} aria-label="Harvest vault cycle preview">
          <div className={`${styles.orbit} ${styles.orbitOne}`} />
          <div className={`${styles.orbit} ${styles.orbitTwo}`} />
          <div
            className={styles.yieldCard}
            onClick={() => setSelectedVault(vaults[0])}
            style={{ cursor: "pointer" }}
            title="Click to view xNVDA Vault"
          >
            <div className={styles.cardTop}><span className={styles.cardLabel}>THIS WEEK&apos;S HARVEST</span><span className={styles.statusPill}>LIVE</span></div>
            <div className={styles.yieldAmount}>+$42.80</div>
            <div className={styles.yieldMeta}><span>Estimated premium</span><strong>+8.4%</strong></div>
            <div className={styles.progressTrack}><span /></div>
            <div className={styles.cardBottom}><span>Cycle ends in</span><strong>4d 12h</strong></div>
          </div>
          <div className={`${styles.floatingToken} ${styles.tokenOne}`} onClick={() => setSelectedVault(vaults[0])} style={{ cursor: "pointer" }}><span className={styles.tokenIcon}>N</span><div><strong>xNVDA</strong><small>$213.90</small></div></div>
          <div className={`${styles.floatingToken} ${styles.tokenTwo}`} onClick={() => setSelectedVault(vaults[1])} style={{ cursor: "pointer" }}><span className={styles.tokenIcon}>A</span><div><strong>xAAPL</strong><small>$228.71</small></div></div>
          <div className={`${styles.floatingToken} ${styles.tokenThree}`} onClick={() => setSelectedVault(vaults[2])} style={{ cursor: "pointer" }}><span className={styles.tokenIcon}>T</span><div><strong>xTSLA</strong><small>$441.62</small></div></div>
        </div>
      </section>

      <section className={styles.statsBar} aria-label="Harvest protocol stats">
        <div><strong>$2.4M</strong><span>Collateralized TVL</span></div><div><strong>31.2%</strong><span>Avg. rolling APY</span></div><div><strong>Auto</strong><span>Rollover mode</span></div><div><strong>Hermes</strong><span>Keeper oracle</span></div>
      </section>

      <section className={styles.section} id="how-it-works">
        <div className={styles.sectionIntro}><div><span className={styles.sectionKicker}>01 DEPOSIT / 02 LOCK / 03 SETTLE / 04 CLAIM</span><h2>How it works</h2></div><p>Six instructions. Weekly cycle. Keeper plus Pyth Hermes off-chain, settlement on-chain.</p></div>
        <div className={styles.steps}><div className={styles.step}><span>01</span><h3>Deposit</h3><p>Min 1.0 xStock. Creates a UserPosition PDA while the vault is accepting deposits.</p></div><div className={styles.step}><span>02</span><h3>Lock</h3><p>Keeper locks an out-of-the-money strike using the Pyth Hermes price feed.</p></div><div className={styles.step}><span>03</span><h3>Settle</h3><p>OTM keeps your xStock. ITM settles pro-rata USDC proceeds plus premium.</p></div></div>
      </section>

      <section className={styles.vaultSection} id="vaults">
        <div className={styles.sectionIntro}>
          <div><span className={styles.sectionKicker}>VAULTS // SPL-2022 · 8DP</span><h2>Active vaults</h2></div>
          <a href="#vaults" className={styles.viewAll}>View all vaults <span>→</span></a>
        </div>
        <div className={styles.vaultGrid}>
          {vaults.map((vault) => (
            <article
              className={styles.vaultCard}
              key={vault.symbol}
              onClick={() => setSelectedVault(vault)}
              style={{ cursor: "pointer" }}
              title={`Open ${vault.symbol} Vault`}
            >
              <div className={styles.vaultHeader}>
                <span className={styles.assetIcon} style={{ backgroundColor: vault.color }}>{vault.symbol[1]}</span>
                <div><h3>{vault.symbol}</h3><span>{vault.name}</span></div>
                <span className={styles.arrow}>↗</span>
              </div>
              <div className={styles.vaultPrice}>
                <span>Current price</span>
                <strong>{vault.price}</strong>
              </div>
              <div className={styles.vaultFooter}>
                <span>Est. weekly premium <strong>{vault.premium}</strong></span>
                <span className={styles.open}>Open vault →</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.riskSection} id="risks">
        <div><span className={styles.sectionKicker}>DESIGNED FOR CLARITY</span><h2>Yield with<br /><em>nothing hidden.</em></h2></div>
        <p>Covered calls have trade-offs. If your stock rises above the strike, it may be converted to USDC. We make every outcome clear before you deposit.</p>
        <a href="#how-it-works" className={styles.outlineButton}>Read the risks <span>↗</span></a>
      </section>

      <footer className={styles.footer}>
        <a href="#top" className={styles.brand}><span className={styles.brandMark}>H</span><span>harvest</span></a>
        <span>Programmable yield for tokenized equities.</span>
        <span className={styles.footerRight}>A Stocklana hackathon project · Built on Solana</span>
      </footer>

      {selectedVault && (
        <VaultModal vault={selectedVault} onClose={() => setSelectedVault(null)} />
      )}
    </main>
  );
}
