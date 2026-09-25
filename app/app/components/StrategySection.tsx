"use client";

import React from "react";
import styles from "../design-v2.module.css";
import PayoffVisualizer from "./PayoffVisualizer";

export default function StrategySection() {
  return (
    <section className={styles.strategySection} id="strategy">
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionKicker} style={{ color: "var(--accent-gold)" }}>
            TRANSPARENT MECHANICS
          </span>
          <h2 className={styles.strategyHeading}>
            Premium today.<br />
            Defined trade-off tomorrow.
          </h2>
          <p className={styles.strategyIntro}>
            Harvest covered-call vaults generate upfront cash income by accepting a capped upside.
            We make the economic trade-off 100% explicit before you deposit.
          </p>
        </div>

        {/* Two Concrete Scenarios */}
        <div className={styles.scenariosGrid}>
          <div className={styles.scenarioCard}>
            <span className={styles.scenarioTag}>Scenario A</span>
            <h3 className={styles.scenarioTitle}>Stock stays below strike</h3>
            <p className={styles.scenarioBody}>
              If the underlying stock price closes below the strike at weekly expiry, the call option expires worthless.
              You retain 100% of your deposited xStocks and keep the full weekly cash premium.
            </p>
          </div>

          <div className={styles.scenarioCard}>
            <span className={styles.scenarioTag}>Scenario B</span>
            <h3 className={styles.scenarioTitle}>Stock rises above strike</h3>
            <p className={styles.scenarioBody}>
              If the stock closes at or above the strike, your position is exercised.
              You receive the full cash value of the strike in USDC plus you keep the premium, forfeiting any gains beyond the strike.
            </p>
          </div>
        </div>

        {/* Interactive Simulation */}
        <PayoffVisualizer />
      </div>
    </section>
  );
}
