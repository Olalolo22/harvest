"use client";

import React from "react";
import styles from "../design-v2.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerRow}>
          <div className={styles.footerBrand}>
            <strong>HARVEST</strong>
            <span>Weekly income for tokenized stocks on Solana.</span>
          </div>

          <div className={styles.footerLinks}>
            <a href="#how-it-works">How it works</a>
            <a href="#vaults">Vaults</a>
            <a href="#strategy">Strategy</a>
            <a href="#risks">Risks</a>
            <a
              href="https://github.com/Olalolo22/harvest"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub ↗
            </a>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div>Built on Solana · Powered by Pyth · Non-custodial</div>
          <div>Stocklana Hackathon Project · Devnet / Experimental</div>
        </div>
      </div>
    </footer>
  );
}
