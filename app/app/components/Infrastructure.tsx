"use client";

import React from "react";
import styles from "../design-v2.module.css";

export default function Infrastructure() {
  const partners = [
    { name: "xStocks", role: "Tokenized Equity Collateral" },
    { name: "Solana", role: "High-Throughput Settlement" },
    { name: "Pyth Network", role: "Real-time Institutional Oracles" },
  ];

  return (
    <section className={styles.infraSection} aria-label="Underlying infrastructure">
      <div className={styles.container}>
        <div className={styles.infraGrid}>
          <div>
            <span className={styles.sectionKicker}>ECOSYSTEM</span>
            <h2 className={styles.infraTitle}>
              Built for tokenized equities on Solana.
            </h2>
            <p className={styles.infraBody}>
              Harvest bridges traditional equity derivatives with high-speed Solana primitives:
              tokenized stocks, real-time market oracles, and automated vault settlement.
            </p>
          </div>

          <div className={styles.infraPills}>
            {partners.map((p, i) => (
              <div key={i} className={styles.infraPill}>
                <span className={styles.infraDot} />
                <div>
                  <strong>{p.name}</strong>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>
                    {p.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
