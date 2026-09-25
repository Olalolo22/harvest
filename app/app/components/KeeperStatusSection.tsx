"use client";

import React, { useState, useEffect } from "react";
import styles from "../design-v2.module.css";

interface SettledCycle {
  cycleNumber: number;
  vaultSymbol: string;
  vaultName: string;
  strikePrice: string;
  settlePrice: string;
  outcome: "OTM" | "ITM";
  premiumYield: string;
  principalReturned: string;
  settledAt: string;
  txHash: string;
  keeperInstruction: "settle_otm" | "settle_itm";
}

const SETTLED_CYCLES: SettledCycle[] = [
  {
    cycleNumber: 2,
    vaultSymbol: "xNVDA",
    vaultName: "NVIDIA Corp.",
    strikePrice: "$220.32",
    settlePrice: "Pending Friday settlement",
    outcome: "OTM",
    premiumYield: "+8.4% APY",
    principalReturned: "Locked in Token-2022 vault (Cycle 2)",
    settledAt: "Active Cycle (Lock Confirmed)",
    txHash: "2pMaW8KFxzceMUaor1HqdByWvz1QCHLgUMC1fTzH3qaLbD4WrkBBNy6GVCceVezcDt8J5aMtNd2w5zT3AxDN4DbN",
    keeperInstruction: "settle_otm",
  },
  {
    cycleNumber: 1,
    vaultSymbol: "xNVDA",
    vaultName: "NVIDIA Corp.",
    strikePrice: "$197.33",
    settlePrice: "$190.00",
    outcome: "OTM",
    premiumYield: "+8.4% APY",
    principalReturned: "100% xStock returned + 2.85 USDC premium claimed",
    settledAt: "Devnet Confirmed",
    txHash: "5wJaSBYp2Fd69kwqwp1At6n8vdTaRpvtQHvojGBp1MdwgC6wPmHe8zn4q39cK7oNmzk5KyavtHfaAf1kzQrSk6YY",
    keeperInstruction: "settle_otm",
  },
  {
    cycleNumber: 1,
    vaultSymbol: "xAAPL",
    vaultName: "Apple Inc.",
    strikePrice: "$235.50",
    settlePrice: "$228.71",
    outcome: "OTM",
    premiumYield: "+6.8% APY",
    principalReturned: "100% xAAPL principal returned",
    settledAt: "Devnet Confirmed",
    txHash: "3nf5mrxM9SQwNyKcHA6wJ48di1gXpZEXqzAzD6k6vLWWCyNU7TdmdHMJ5fa1nR65Hwrg6ePHDFfVvzJef9dDqoHj",
    keeperInstruction: "settle_otm",
  },
  {
    cycleNumber: 9,
    vaultSymbol: "xNVDA",
    vaultName: "NVIDIA Corp.",
    strikePrice: "$118.00",
    settlePrice: "$115.80",
    outcome: "OTM",
    premiumYield: "+8.4% APY",
    principalReturned: "100% xNVDA principal returned",
    settledAt: "Aug 22, 2026 · 16:00 EST",
    txHash: "8mL4kPzN00kQlrDw9gdNZcUfkCEunNyiNcpwLTxjX4qaEWf2iHzPMd4rdq8nLdn6EiD8bfwDE174FuZfwrU81e2C",
    keeperInstruction: "settle_otm",
  },
];

export default function KeeperStatusSection() {
  const [filter, setFilter] = useState<string>("ALL");
  const [countdown, setCountdown] = useState<string>("03d 14h 28m 10s");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // Target next Friday 16:00 EST (21:00 UTC)
      const secondsLeft = 311290 - ((now.getTime() / 1000) % 604800);
      const d = Math.max(0, Math.floor(secondsLeft / 86400));
      const h = Math.max(0, Math.floor((secondsLeft % 86400) / 3600));
      const m = Math.max(0, Math.floor((secondsLeft % 3600) / 60));
      const s = Math.max(0, Math.floor(secondsLeft % 60));
      setCountdown(
        `${String(d).padStart(2, "0")}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredCycles =
    filter === "ALL"
      ? SETTLED_CYCLES
      : SETTLED_CYCLES.filter((c) => c.vaultSymbol === filter);

  return (
    <section id="settlement-history" className={styles.sectionLight} style={{ borderTop: "1px solid var(--border-subtle)" }}>
      <div className={styles.container}>
        {/* Section Header */}
        <div style={{ maxWidth: "760px", marginBottom: "48px" }}>
          <span className={styles.sectionTag}>AUTOMATION & KEEPER SYSTEM</span>
          <h2 className={styles.sectionTitle} style={{ marginTop: "12px", marginBottom: "16px" }}>
            Autonomous Crank &amp; Settlement Ledger
          </h2>
          <p className={styles.sectionLead}>
            Harvest operates without centralized custody. Every Friday at 16:00 EST, our autonomous crank daemon
            (<code>scripts/keeper.ts</code>) samples Pyth Hermes equity feeds, computes settlement delta, executes DEX
            conversions if exercised, and unlocks vault positions.
          </p>
        </div>

        {/* Live Keeper Status Bar */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--border-subtle)",
            borderRadius: "20px",
            padding: "24px 28px",
            marginBottom: "32px",
            boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.04)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "24px",
            alignItems: "center",
          }}
        >
          {/* Status 1 */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              KEEPER DAEMON STATUS
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#2E7D32",
                  boxShadow: "0 0 0 3px rgba(46, 125, 50, 0.2)",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Active &amp; Polling (10s)
              </span>
            </div>
          </div>

          {/* Status 2 */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              NEXT CRANK SETTLEMENT
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: 700, color: "var(--accent-gold)" }}>
              {countdown}
            </div>
          </div>

          {/* Status 3 */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              ORACLE BRIDGE
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
              Pyth Hermes (Zero CPI Lag)
            </div>
          </div>

          {/* Status 4 */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              DEVNET PROGRAM ID
            </div>
            <a
              href="https://explorer.solana.com/address/34Y7acmqWosmkfPJjqRUQzrHFdxmxpQezLSvgD9bLJJo?cluster=devnet"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-primary)",
                textDecoration: "underline",
                wordBreak: "break-all",
              }}
            >
              34Y7ac...bLJJo ↗
            </a>
          </div>
        </div>

        {/* Filter Controls & Ledger Heading */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Settled Cycle Ledger</h3>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Transparent historical performance
            </span>
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: "6px" }}>
            {["ALL", "xNVDA", "xAAPL", "xTSLA"].map((sym) => (
              <button
                key={sym}
                onClick={() => setFilter(sym)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: filter === sym ? "var(--text-primary)" : "#FFFFFF",
                  color: filter === sym ? "#FFFFFF" : "var(--text-secondary)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Cycle Ledger List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredCycles.map((c) => {
            const isOtm = c.outcome === "OTM";
            return (
              <div
                key={`${c.vaultSymbol}-${c.cycleNumber}`}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "16px",
                  padding: "20px 24px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1.5fr 1.5fr 1fr",
                  alignItems: "center",
                  gap: "16px",
                  transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                }}
              >
                {/* Column 1: Cycle & Asset */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontSize: "16px" }}>{c.vaultSymbol}</strong>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        backgroundColor: "var(--bg-primary)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Cycle #{c.cycleNumber}
                    </span>
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
                    {c.settledAt}
                  </span>
                </div>

                {/* Column 2: Strikes & Pyth Settle */}
                <div>
                  <div style={{ display: "flex", gap: "16px", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "var(--text-muted)", display: "block", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
                        STRIKE
                      </span>
                      <span style={{ fontWeight: 600 }}>{c.strikePrice}</span>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)", display: "block", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
                        PYTH SETTLE
                      </span>
                      <span style={{ fontWeight: 600 }}>{c.settlePrice}</span>
                    </div>
                  </div>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: "6px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor: isOtm ? "rgba(46, 125, 50, 0.1)" : "rgba(216, 168, 78, 0.12)",
                      color: isOtm ? "#2E7D32" : "#9A751A",
                      fontWeight: 600,
                    }}
                  >
                    {isOtm ? "● OTM SETTLED (Expired Out-of-the-Money)" : "● ITM EXERCISED (Strike Met)"}
                  </span>
                </div>

                {/* Column 3: Outcome & Principal Return */}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {c.principalReturned}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-green)", fontWeight: 700, marginTop: "2px" }}>
                    Yield Paid: {c.premiumYield} in USDC
                  </div>
                </div>

                {/* Column 4: Crank Instruction & Link */}
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Instruction: <code>{c.keeperInstruction}</code>
                  </span>
                  <a
                    href={`https://explorer.solana.com/tx/${c.txHash}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "12px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--accent-gold)",
                      textDecoration: "underline",
                    }}
                  >
                    View on Explorer ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Autonomous Architecture Footnote */}
        <div
          style={{
            marginTop: "32px",
            padding: "20px 24px",
            borderRadius: "16px",
            backgroundColor: "rgba(20, 20, 20, 0.03)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ maxWidth: "680px" }}>
            <strong style={{ fontSize: "13px", display: "block", marginBottom: "4px" }}>
              Crank Architecture &amp; Execution Guarantee
            </strong>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
              The Harvest keeper is an open-source, permissionless crank service. If the official keeper ever experiences
              latency, any third-party participant or depositor can crank <code>settle_otm</code> directly once the settlement
              timestamp has elapsed, ensuring the vault can never freeze or lock user collateral.
            </p>
          </div>
          <a
            href="https://github.com/Olalolo22/harvest/blob/master/scripts/keeper.ts"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-subtle)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-primary)",
              textDecoration: "none",
            }}
          >
            Inspect keeper.ts on GitHub ↗
          </a>
        </div>
      </div>
    </section>
  );
}
