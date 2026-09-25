"use client";

import React from "react";
import styles from "../design-v2.module.css";

export default function ConceptSection() {
  return (
    <section className={styles.conceptSection} aria-label="Conceptual introduction to Harvest">
      <div className={styles.container}>
        <div className={styles.conceptGrid}>
          {/* Left Column: Editorial Explanation */}
          <div>
            <span className={styles.sectionKicker}>THE PRINCIPLE</span>
            <h2 className={styles.conceptHeading}>
              Your stocks don&apos;t have to sit idle.
            </h2>
            <p className={styles.conceptBody}>
              Harvest lets xStock holders sell automated covered calls against their positions and collect premium each week.
            </p>
            <p className={styles.conceptBody} style={{ marginTop: "16px" }}>
              You keep full price exposure to the underlying stock while accepting a defined trade-off:
              if the stock closes above the selected strike at weekly expiry, your position is settled in USDC at that strike.
            </p>
          </div>

          {/* Right Column: Flow pipeline */}
          <div className={styles.conceptPipelineCard}>
            <span className={styles.pipelineLabel}>PROGRAMMATIC FLOW</span>
            <div className={styles.pipelineFlow}>
              <div className={styles.pipelineStep}>
                <div>
                  <strong>01. Underlying xStock</strong>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Deposit tokenized equity tokens</div>
                </div>
                <span>xNVDA · xAAPL · xTSLA</span>
              </div>

              <div className={styles.pipelineArrow}>↓</div>

              <div className={styles.pipelineStep} style={{ background: "#FFFFFF", borderColor: "var(--accent-gold)" }}>
                <div>
                  <strong style={{ color: "var(--text-primary)" }}>02. Covered Call Vault</strong>
                  <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>Fixed OTM strike selected via Pyth</div>
                </div>
                <span style={{ color: "var(--accent-gold)", fontWeight: 600 }}>Strike +5% to +8%</span>
              </div>

              <div className={styles.pipelineArrow}>↓</div>

              <div className={styles.pipelineStep}>
                <div>
                  <strong>03. Weekly Yield Collected</strong>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Paid out upon cycle settlement</div>
                </div>
                <span style={{ color: "var(--accent-green)", fontWeight: 600 }}>+6% to +10% annualized</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
