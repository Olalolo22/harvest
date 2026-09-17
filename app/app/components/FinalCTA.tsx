"use client";

import React from "react";
import styles from "../design-v2.module.css";

export default function FinalCTA() {
  return (
    <section className={styles.ctaSection} aria-label="Call to action">
      <div className={styles.container}>
        <h2 className={styles.ctaHeading}>
          Your xStocks can do<br />
          more than sit there.
        </h2>
        <p className={styles.ctaSub}>
          Put them to work for the week. Collect upfront premiums in non-custodial vaults.
        </p>

        <div className={styles.ctaActionRow}>
          <a href="#vaults" className={styles.primaryCta}>
            Explore vaults <span aria-hidden="true">→</span>
          </a>
          <a href="#strategy" className={styles.secondaryCta}>
            Read the strategy <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
