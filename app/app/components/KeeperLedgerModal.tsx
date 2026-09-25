"use client";

import React, { useState, useEffect } from "react";

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
];

interface KeeperLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeeperLedgerModal({ isOpen, onClose }: KeeperLedgerModalProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [countdown, setCountdown] = useState<string>("03d 14h 28m 10s");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
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

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = filter === "ALL" ? SETTLED_CYCLES : SETTLED_CYCLES.filter((c) => c.vaultSymbol === filter);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 12, 8, 0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 1200,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px 16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "840px",
          maxHeight: "calc(100dvh - 64px)",
          backgroundColor: "#161713",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "24px",
          color: "#FFFFFF",
          padding: "32px 28px",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          fontFamily: "var(--font-sans)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "var(--accent-gold)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              AUTONOMOUS KEEPER &amp; CRANK
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "4px 0 0 0" }}>
              Verified On-Chain Settlement Ledger
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "#FFFFFF",
              fontSize: "16px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Status metrics grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "24px" }}>
          <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>Keeper Daemon</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--lime)", marginTop: "4px" }}>● Active (10s Poll)</div>
          </div>
          <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>Oracle Feed</div>
            <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "4px" }}>Pyth Hermes Devnet</div>
          </div>
          <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>Next Expiry</div>
            <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", marginTop: "4px" }}>{countdown}</div>
          </div>
          <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>Program ID</div>
            <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--accent-gold)", marginTop: "4px" }}>34Y7...LJJo</div>
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {["ALL", "xNVDA", "xAAPL"].map((sym) => (
            <button
              key={sym}
              onClick={() => setFilter(sym)}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: filter === sym ? "var(--cream)" : "rgba(255,255,255,0.06)",
                color: filter === sym ? "var(--ink)" : "rgba(255,255,255,0.8)",
                border: "none",
              }}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Ledger items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((cycle) => (
            <div
              key={`${cycle.vaultSymbol}-${cycle.cycleNumber}`}
              style={{
                padding: "16px 20px",
                borderRadius: "14px",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "15px" }}>{cycle.vaultSymbol} — Cycle #{cycle.cycleNumber}</strong>
                  <span style={{ marginLeft: "10px", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{cycle.settledAt}</span>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(108, 156, 66, 0.2)",
                    color: "var(--lime)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {cycle.outcome} · {cycle.premiumYield}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                <div>Strike: <strong>{cycle.strikePrice}</strong> · {cycle.principalReturned}</div>
                <a
                  href={`https://explorer.solana.com/tx/${cycle.txHash}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--accent-gold)", textDecoration: "underline", fontFamily: "var(--font-mono)" }}
                >
                  Tx: {cycle.txHash.slice(0, 6)}...{cycle.txHash.slice(-4)} ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
