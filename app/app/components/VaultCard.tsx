"use client";

import React from "react";
import styles from "../design-v2.module.css";
import { VaultItem } from "./Hero";

interface VaultCardProps {
  vault: VaultItem;
  onSelect: (vault: VaultItem) => void;
}

export default function VaultCard({ vault, onSelect }: VaultCardProps) {
  return (
    <article
      className={styles.productVaultCard}
      onClick={() => onSelect(vault)}
      title={`Open ${vault.symbol} Covered-Call Vault`}
    >
      <div className={styles.cardTopRow}>
        <span className={styles.cardTicker}>{vault.symbol}</span>
        <span className={styles.cardPrice}>{vault.price}</span>
      </div>
      <div className={styles.cardCompanyName}>{vault.name}</div>

      <div className={styles.cardMetricBox}>
        <span className={styles.cardMetricLabel}>Est. Weekly Premium</span>
        <span className={styles.cardMetricNum}>+{vault.premium}</span>
      </div>

      <div className={styles.cardDetailsList}>
        <div className={styles.cardDetailRow}>
          <span>Selected Strike</span>
          <strong>{vault.strike}</strong>
        </div>
        <div className={styles.cardDetailRow}>
          <span>Cycle Expiry</span>
          <strong>4d 12h</strong>
        </div>
        <div className={styles.cardDetailRow}>
          <span>Settlement Asset</span>
          <strong>USDC / {vault.symbol}</strong>
        </div>
        <div className={styles.cardDetailRow}>
          <span>Environment</span>
          <strong style={{ color: "var(--accent-gold)" }}>Solana Devnet</strong>
        </div>
      </div>

      <div className={styles.cardActionRow}>
        <span>Open vault</span>
        <span className={styles.cardActionArrow} aria-hidden="true">→</span>
      </div>
    </article>
  );
}
