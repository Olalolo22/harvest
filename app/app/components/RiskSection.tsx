"use client";

import React from "react";
import styles from "../design-v2.module.css";

export default function RiskSection() {
  const risks = [
    {
      title: "Limited Upside",
      desc: "If the underlying stock surges past the strike price before weekly expiry, your upside is capped at the strike. You receive the full cash strike price plus premium, but forfeit additional gains.",
    },
    {
      title: "Market Risk",
      desc: "Covered calls provide a cushion via the collected premium, but they do not eliminate downside equity risk. If the stock falls dramatically, your overall portfolio value can still decrease.",
    },
    {
      title: "Strategy & Smart Contract Risk",
      desc: "Vault yields fluctuate weekly based on underlying implied volatility and market conditions. Harvest operates on Solana Devnet with audited Anchor smart contract logic.",
    },
  ];

  return (
    <section className={styles.riskSection} id="risks" aria-label="Risk Disclosure">
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionKicker}>HONEST DISCLOSURE</span>
          <h2 className={styles.sectionTitle}>Yield with nothing hidden.</h2>
          <p className={styles.sectionSubtitle}>
            Covered calls generate reliable upfront cash flow, but they are investment instruments with explicit trade-offs.
          </p>
        </div>

        <div className={styles.riskGrid}>
          {risks.map((risk, index) => (
            <div key={index} className={styles.riskCard}>
              <h3 className={styles.riskCardTitle}>{risk.title}</h3>
              <p className={styles.riskCardBody}>{risk.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
