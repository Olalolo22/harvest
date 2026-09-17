"use client";

import React from "react";
import styles from "../design-v2.module.css";

export interface VaultItem {
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

interface HeroProps {
  onSelectVault: (vault: VaultItem) => void;
  featuredVault: VaultItem;
}

export default function Hero({ onSelectVault, featuredVault }: HeroProps) {
  return (
    <section className={styles.heroSection} id="top">
      <div className={styles.container}>
        <div className={styles.heroGrid}>
          {/* Left Column: Copy & CTAs */}
          <div className={styles.heroContent}>
            <div className={styles.eyebrow}>
              <span className={styles.livePulseDot} />
              <span>Weekly Income for xStocks</span>
            </div>

            <h1 className={styles.heroHeadline}>
              Turn your xStocks<br />
              <em>into weekly income.</em>
            </h1>

            <p className={styles.heroDescription}>
              Automated covered-call vaults for tokenized stocks on Solana.
              Keep your exposure, collect premiums, and settle every week.
            </p>

            <div className={styles.heroCtaRow}>
              <a href="#vaults" className={styles.primaryCta}>
                Explore vaults <span aria-hidden="true">→</span>
              </a>
              <a href="#how-it-works" className={styles.secondaryCta}>
                See how it works <span aria-hidden="true">↓</span>
              </a>
            </div>

            <div className={styles.heroMicroInfo}>
              <span>Built on Solana</span>
              <span className={styles.heroMicroDivider}>·</span>
              <span>Powered by Pyth</span>
              <span className={styles.heroMicroDivider}>·</span>
              <span>Non-custodial</span>
            </div>
          </div>

          {/* Right Column: Large Premium Vault Card Object */}
          <div className={styles.heroVaultCardWrap}>
            <article
              className={styles.heroVaultCard}
              onClick={() => onSelectVault(featuredVault)}
              title={`Open ${featuredVault.symbol} Vault`}
            >
              <div className={styles.heroCardHeader}>
                <div className={styles.heroCardBadge}>
                  <span className={styles.livePulseDot} style={{ width: 6, height: 6 }} />
                  <span>LIVE DEVNET</span>
                </div>
                <span className={styles.heroCardSub}>CYCLE 02</span>
              </div>

              <div className={styles.heroCardTickerRow}>
                <span className={styles.heroCardTicker}>{featuredVault.symbol}</span>
                <span className={styles.heroCardPrice}>{featuredVault.price}</span>
              </div>
              <div className={styles.heroCardName}>NVIDIA Corporation · Tokenized Stock</div>

              <div className={styles.heroCardMetricBlock}>
                <span className={styles.heroCardMetricLabel}>Est. Weekly Premium</span>
                <span className={styles.heroCardMetricValue}>+{featuredVault.premium}</span>
              </div>

              <div className={styles.heroCardMetaGrid}>
                <div className={styles.heroCardMetaCol}>
                  <small>Selected Strike</small>
                  <strong>{featuredVault.strike}</strong>
                </div>
                <div className={styles.heroCardMetaCol}>
                  <small>Cycle Remaining</small>
                  <strong>4d 12h</strong>
                </div>
              </div>

              <button
                type="button"
                className={styles.heroCardButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectVault(featuredVault);
                }}
              >
                <span>Open vault</span>
                <span aria-hidden="true">→</span>
              </button>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
