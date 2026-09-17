"use client";

import React from "react";
import styles from "../design-v2.module.css";

export default function WhyHarvest() {
  const pillars = [
    {
      eyebrow: "01 · DURATION",
      statement: "Weekly",
      body: "One predictable 7-day cycle. No locking up capital for months, and no opaque rolling schedules.",
    },
    {
      eyebrow: "02 · SECURITY",
      statement: "Non-custodial",
      body: "Assets remain exclusively governed by verified Anchor smart contracts on Solana. Never lent out or rehypothecated.",
    },
    {
      eyebrow: "03 · GOVERNANCE",
      statement: "Transparent",
      body: "Every parameter—strike, premium, oracle source, and settlement outcome—is verified on-chain before you commit.",
    },
  ];

  return (
    <section className={styles.whySection} aria-label="Why Harvest">
      <div className={styles.container}>
        <span className={styles.sectionKicker}>FOUNDATIONS</span>
        <h2 className={styles.sectionTitle}>Engineered for financial discipline.</h2>

        <div className={styles.whyGrid}>
          {pillars.map((item, idx) => (
            <div key={idx} className={styles.whyCard}>
              <span className={styles.whyEyebrow}>{item.eyebrow}</span>
              <h3 className={styles.whyStatement}>{item.statement}</h3>
              <p className={styles.whyBody}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
