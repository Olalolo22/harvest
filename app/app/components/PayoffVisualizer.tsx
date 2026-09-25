"use client";

import React, { useState } from "react";
import styles from "../design-v2.module.css";

export default function PayoffVisualizer() {
  const strikePrice = 225;
  const initialPrice = 213.9;
  const premiumReceived = 17.96; // ~8.4% of price

  const [simulatedPrice, setSimulatedPrice] = useState<number>(218);

  const isExercised = simulatedPrice >= strikePrice;
  // Total economic value:
  // If simulatedPrice < strikePrice: you have stock valued at simulatedPrice + premium
  // If simulatedPrice >= strikePrice: you have cash valued at strikePrice + premium
  const finalValue = isExercised
    ? strikePrice + premiumReceived
    : simulatedPrice + premiumReceived;

  const pnlVsHodl = isExercised
    ? (strikePrice + premiumReceived) - simulatedPrice
    : premiumReceived;

  return (
    <div className={styles.payoffBox}>
      <div className={styles.payoffHeader}>
        <div>
          <h3>Interactive Payoff Simulation (xNVDA Vault)</h3>
          <span style={{ fontSize: 13, color: "var(--text-dark-muted)" }}>
            Strike: <strong>${strikePrice}.00</strong> · Upfront Premium: <strong>+${premiumReceived.toFixed(2)}</strong> (+8.4%)
          </span>
        </div>
      </div>

      <div className={styles.payoffControls}>
        <div className={styles.sliderTrackRow}>
          <div className={styles.sliderLabels}>
            <span>$180 (Downside)</span>
            <span style={{ color: "var(--accent-gold)" }}>Strike: ${strikePrice}</span>
            <span>$260 (Upside)</span>
          </div>
          <input
            type="range"
            min={180}
            max={260}
            step={1}
            value={simulatedPrice}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSimulatedPrice(Number(e.target.value))}
            className={styles.priceSlider}
            aria-label="Simulated xNVDA stock price at weekly expiry"
          />
        </div>
      </div>

      <div className={styles.payoffResultCallout}>
        <div className={styles.payoffResultCol}>
          <small>Stock Price at Expiry</small>
          <strong>${simulatedPrice}.00</strong>
        </div>

        <div className={styles.payoffResultCol}>
          <small>Total Value Realized</small>
          <strong>${finalValue.toFixed(2)}</strong>
        </div>

        <div className={`${styles.payoffOutcomeTag} ${isExercised ? styles.outcomeAbove : styles.outcomeBelow}`}>
          {isExercised ? (
            <div>
              <strong>Exercised at Strike</strong>
              <div style={{ fontSize: 11, marginTop: 2 }}>
                Collateral converted to ${strikePrice} USDC + you keep ${premiumReceived.toFixed(2)} premium.
              </div>
            </div>
          ) : (
            <div>
              <strong>Not Exercised (Below Strike)</strong>
              <div style={{ fontSize: 11, marginTop: 2 }}>
                You keep 100% of your xNVDA shares + collect ${premiumReceived.toFixed(2)} cash premium.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
