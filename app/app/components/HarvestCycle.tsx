"use client";

import React from "react";
import styles from "../design-v2.module.css";

export default function HarvestCycle() {
  const steps = [
    {
      num: "01",
      title: "Deposit",
      desc: "Choose an xStock vault and deposit your tokens. Smart contract locks the collateral for exactly 7 days.",
      detail: "Non-custodial · You remain in control of your position.",
    },
    {
      num: "02",
      title: "Harvest",
      desc: "Harvest selects a fixed out-of-the-money strike via Pyth benchmark and writes covered calls to collect the upfront weekly premium.",
      detail: "Automated · Strike defined at cycle inception.",
    },
    {
      num: "03",
      title: "Settle",
      desc: "At expiry, the position settles according to the outcome. You receive the premium, with underlying returned or settled in USDC if exercised.",
      detail: "Deterministic · Transparent on-chain execution.",
    },
  ];

  return (
    <section className={styles.cycleSection} id="how-it-works">
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionKicker}>THE HARVEST CYCLE</span>
          <h2 className={styles.sectionTitle}>
            One week.<br />
            One simple strategy.
          </h2>
          <p className={styles.sectionSubtitle}>
            Harvest automates the covered-call cycle around your tokenized stocks on Solana so you collect predictable weekly yield without manual execution.
          </p>
        </div>

        <div className={styles.cycleGrid}>
          {steps.map((step) => (
            <div key={step.num} className={styles.cycleCard}>
              <div>
                <span className={styles.cycleNumber}>{step.num}</span>
                <h3 className={styles.cycleTitle}>{step.title}</h3>
                <p className={styles.cycleBody}>{step.desc}</p>
              </div>
              <div className={styles.cycleDetail}>{step.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
