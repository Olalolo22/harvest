"use client";

import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { VaultItem } from "./Hero";

interface VaultModalProps {
  vault: VaultItem | null;
  onClose: () => void;
  onOpenFaucet?: () => void;
}

export default function VaultModal({ vault, onClose, onOpenFaucet }: VaultModalProps) {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [tab, setTab] = useState<"deposit" | "claim">("deposit");
  const [amount, setAmount] = useState<string>("1.0");
  const [loading, setLoading] = useState<boolean>(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  type StrikeProfile = "conservative" | "balanced" | "aggressive";
  const [strikeProfile, setStrikeProfile] = useState<StrikeProfile>("balanced");

  if (!vault) return null;

  const numericAmount = parseFloat(amount) || 0;
  const currentNumericPrice = parseFloat(vault.price.replace("$", "")) || 200;
  const estimatedUsdValue = numericAmount * currentNumericPrice;

  const strikeMultiplier =
    strikeProfile === "conservative" ? 1.04 : strikeProfile === "balanced" ? 1.08 : 1.12;
  const dynamicStrike = `$${(currentNumericPrice * strikeMultiplier).toFixed(2)}`;
  const dynamicPremiumPct =
    strikeProfile === "conservative" ? "5.2%" : strikeProfile === "balanced" ? "8.4%" : "12.1%";
  const weeklyYieldRate =
    strikeProfile === "conservative" ? 0.052 : strikeProfile === "balanced" ? 0.084 : 0.121;
  const estimatedPremiumUsdc = (estimatedUsdValue * (weeklyYieldRate * 0.2)).toFixed(2);

  const handleDeposit = async () => {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }
    if (numericAmount < 1.0) {
      setErrorMsg("Minimum deposit is 1.0 xStock token.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setTxSignature(null);

    try {
      await new Promise((r) => setTimeout(r, 1200));
      setTxSignature(
        "4iGLKidV77gMkrAV6dbNZcUfkCEunNyiNcpwLTxjX4qaEWf2iHzPMd4rdq8nLdn6EiD8bfwDE174FuZfwrU81e2C"
      );
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setTxSignature(null);

    try {
      await new Promise((r) => setTimeout(r, 1200));
      setTxSignature(
        "5tTm8F5UiytsAJWzHwtdpP4raMkEVhatZgwD75s3frZRFdZGgsos7JKMTnbPBALKDFbo9aEdggfNrVrCxpias9rC"
      );
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(21, 21, 21, 0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "grid",
        placeItems: "center",
        zIndex: 999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "#FFFFFF",
          borderRadius: "24px",
          border: "1px solid rgba(20, 20, 20, 0.12)",
          boxShadow: "0 30px 60px -12px rgba(20, 20, 20, 0.25)",
          padding: "36px",
          position: "relative",
          fontFamily: "var(--font-sans)",
          color: "var(--text-primary)",
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "24px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.04em", margin: 0 }}>
                {vault.symbol}
              </h2>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: "var(--accent-gold-soft)",
                  color: "var(--accent-gold)",
                  fontWeight: 600,
                }}
              >
                DEVNET
              </span>
            </div>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Cycle #{vault.cycle} · {vault.name}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid var(--border-subtle)",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "grid",
              placeItems: "center",
              fontSize: "16px",
              cursor: "pointer",
              color: "var(--text-secondary)",
              lineHeight: 1,
            }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Live Vault Metrics */}
        <div
          style={{
            backgroundColor: "var(--bg-primary)",
            borderRadius: "16px",
            padding: "18px 20px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "24px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                marginBottom: "4px",
              }}
            >
              CURRENT PRICE
            </div>
            <strong style={{ fontSize: "16px", color: "var(--text-primary)" }}>
              {vault.price}
            </strong>
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                marginBottom: "4px",
              }}
            >
              LOCKED STRIKE
            </div>
            <strong style={{ fontSize: "16px", color: "var(--accent-gold)" }}>
              {dynamicStrike}
            </strong>
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                marginBottom: "4px",
              }}
            >
              EST. WEEKLY PREMIUM
            </div>
            <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>
              +{dynamicPremiumPct}
            </strong>
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                marginBottom: "4px",
              }}
            >
              CYCLE EXPIRY
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              4d 12h remaining
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            backgroundColor: "var(--bg-primary)",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "24px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <button
            onClick={() => setTab("deposit")}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              backgroundColor: tab === "deposit" ? "#FFFFFF" : "transparent",
              color: tab === "deposit" ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: tab === "deposit" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            Deposit xStock
          </button>
          <button
            onClick={() => setTab("claim")}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              backgroundColor: tab === "claim" ? "#FFFFFF" : "transparent",
              color: tab === "claim" ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: tab === "claim" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            Claim & Settlement
          </button>
        </div>

        {/* Tab Content: Deposit */}
        {tab === "deposit" ? (
          <div>
            {/* Strike & Risk Profile Selector */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                <span>Strike Risk Profile</span>
                <span style={{ color: "var(--accent-gold)", fontWeight: 600, textTransform: "none", fontSize: "11px" }}>
                  {strikeProfile === "conservative"
                    ? "Conservative (+4% OTM)"
                    : strikeProfile === "balanced"
                    ? "Balanced (+8% OTM)"
                    : "Aggressive (+12% OTM)"}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "8px",
                }}
              >
                {[
                  { id: "conservative" as const, name: "Conservative", otm: "+4% OTM", yield: "~5.2%" },
                  { id: "balanced" as const, name: "Balanced", otm: "+8% OTM", yield: "~8.4%" },
                  { id: "aggressive" as const, name: "Aggressive", otm: "+12% OTM", yield: "~12.1%" },
                ].map((item) => {
                  const isSelected = strikeProfile === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStrikeProfile(item.id)}
                      style={{
                        padding: "10px 8px",
                        borderRadius: "10px",
                        border: isSelected ? "1.5px solid var(--text-primary)" : "1px solid var(--border-subtle)",
                        backgroundColor: isSelected ? "var(--bg-primary)" : "#FFFFFF",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        gap: "2px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: "12px", fontWeight: isSelected ? 700 : 600, color: "var(--text-primary)" }}>
                        {item.name}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                        {item.otm}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: "var(--accent-green)", marginTop: "2px" }}>
                        {item.yield}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                  }}
                >
                  Deposit Amount ({vault.symbol})
                </label>
                {onOpenFaucet && (
                  <button
                    type="button"
                    onClick={onOpenFaucet}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--accent-gold)",
                      textDecoration: "underline",
                      cursor: "pointer",
                      background: "none",
                      border: "none",
                    }}
                  >
                    Need test {vault.symbol}? Faucet ↗
                  </button>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  backgroundColor: "var(--bg-primary)",
                }}
              >
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    fontSize: "20px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-primary)",
                    backgroundColor: "transparent",
                  }}
                  placeholder="1.0"
                />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    marginLeft: "8px",
                  }}
                >
                  {vault.symbol}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginTop: "6px",
                  display: "block",
                }}
              >
                Min deposit: 1.0 token · Est. Value: ~${estimatedUsdValue.toFixed(2)} USD
              </span>
            </div>

            <div
              style={{
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "12px",
                padding: "14px 16px",
                marginBottom: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Weekly Premium Yield:
              </span>
              <strong style={{ fontFamily: "var(--font-mono)", fontSize: "15px", color: "var(--accent-green)" }}>
                +{estimatedPremiumUsdc} USDC
              </strong>
            </div>

            <button
              onClick={handleDeposit}
              disabled={loading}
              style={{
                width: "100%",
                height: "50px",
                backgroundColor: "var(--text-primary)",
                color: "#FFFFFF",
                borderRadius: "999px",
                border: "none",
                fontWeight: 600,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background-color 0.2s ease",
              }}
            >
              {loading ? (
                "Confirming on Solana..."
              ) : connected ? (
                <>
                  Deposit {amount} {vault.symbol} <span>→</span>
                </>
              ) : (
                "Connect Wallet to Deposit"
              )}
            </button>
          </div>
        ) : (
          /* Tab Content: Claim */
          <div>
            <div
              style={{
                backgroundColor: "var(--bg-primary)",
                borderRadius: "16px",
                padding: "18px 20px",
                marginBottom: "24px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Deposited Collateral:</span>
                <strong style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                  1.0 {vault.symbol}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Earned Weekly Premium:</span>
                <strong style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--accent-green)" }}>
                  +2.85 USDC
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Settlement Status:</span>
                <strong style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-gold)" }}>
                  Unexercised (Collateral returned)
                </strong>
              </div>
            </div>

            <button
              onClick={handleClaim}
              disabled={loading}
              style={{
                width: "100%",
                height: "50px",
                backgroundColor: "var(--text-primary)",
                color: "#FFFFFF",
                borderRadius: "999px",
                border: "none",
                fontWeight: 600,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Claiming..." : `Claim 1.0 ${vault.symbol} + 2.85 USDC`}
            </button>
          </div>
        )}

        {/* Transaction Feedback */}
        {txSignature && (
          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              borderRadius: "12px",
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-subtle)",
              fontSize: "12px",
              color: "var(--text-secondary)",
              wordBreak: "break-all",
            }}
          >
            ✅ <strong style={{ color: "var(--text-primary)" }}>Transaction Confirmed!</strong>
            <div style={{ marginTop: "6px" }}>
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent-green)", textDecoration: "underline", fontWeight: 600 }}
              >
                View on Solana Explorer ↗
              </a>
            </div>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              borderRadius: "12px",
              backgroundColor: "rgba(220, 50, 50, 0.08)",
              border: "1px solid rgba(220, 50, 50, 0.2)",
              fontSize: "12px",
              color: "#c62828",
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
