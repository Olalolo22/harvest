"use client";

import React from "react";
import styles from "../design-v2.module.css";

export default function LiveHarvestStrip() {
  const metrics = [
    { value: "+$42.80", label: "Estimated weekly premium / unit" },
    { value: "8.4%", label: "Average weekly premium rate" },
    { value: "4d 12h", label: "Current cycle remaining" },
    { value: "3", label: "Active tokenized equity vaults" },
  ];

  return (
    <section className={styles.liveStripSection} aria-label="Live weekly harvest overview">
      <div className={styles.container}>
        <div className={styles.liveStripHead}>
          <div className={styles.liveStripTitle}>
            <span style={{ color: "var(--accent-gold)" }}>●</span>
            <span>THIS WEEK&apos;S HARVEST</span>
          </div>
          <span className={styles.liveStripTag}>DEMO / DEVNET DATA</span>
        </div>

        <div className={styles.liveStripGrid}>
          {metrics.map((item, idx) => (
            <div key={idx} className={styles.liveStripItem}>
              <div className={styles.liveStripNumber}>{item.value}</div>
              <div className={styles.liveStripLabel}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
