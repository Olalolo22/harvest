"use client";

import React from "react";
import styles from "../design-v2.module.css";
import VaultCard from "./VaultCard";
import { VaultItem } from "./Hero";

interface VaultGridProps {
  vaults: VaultItem[];
  onSelectVault: (vault: VaultItem) => void;
}

export default function VaultGrid({ vaults, onSelectVault }: VaultGridProps) {
  return (
    <section className={styles.vaultsSection} id="vaults">
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionKicker}>PRODUCT SHOWCASE</span>
          <h2 className={styles.sectionTitle}>Find your harvest.</h2>
          <p className={styles.sectionSubtitle}>
            Choose the tokenized stock you want to put to work. Each vault executes an autonomous weekly covered-call strategy with deterministic strike prices.
          </p>
        </div>

        <div className={styles.vaultsGrid}>
          {vaults.map((vault) => (
            <VaultCard
              key={vault.symbol}
              vault={vault}
              onSelect={onSelectVault}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
