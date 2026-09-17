"use client";

import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

interface VaultData {
  symbol: string;
  name: string;
  color: string;
  price: string;
  premium: string;
  strike: string;
  cycle: number;
  status: string;
  mint: string;
}

interface VaultModalProps {
  vault: VaultData | null;
  onClose: () => void;
}

export default function VaultModal({ vault, onClose }: VaultModalProps) {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [tab, setTab] = useState<"deposit" | "claim">("deposit");
  const [amount, setAmount] = useState<string>("1.0");
  const [loading, setLoading] = useState<boolean>(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!vault) return null;

  const numericAmount = parseFloat(amount) || 0;
  const numericPrice = parseFloat(vault.price.replace("$", "")) || 200;
  const estimatedUsdValue = numericAmount * numericPrice;
  // 1.5% weekly premium
  const estimatedPremiumUsdc = (estimatedUsdValue * 0.015).toFixed(2);

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
      // In production / live test: invoke anchor program deposit()
      // Simulate confirmation for demo interaction
      await new Promise((r) => setTimeout(r, 1200));
      setTxSignature("4iGLKidV77gMkrAV6dbNZcUfkCEunNyiNcpwLTxjX4qaEWf2iHzPMd4rdq8nLdn6EiD8bfwDE174FuZfwrU81e2C");
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
      setTxSignature("5tTm8F5UiytsAJWzHwtdpP4raMkEVhatZgwD75s3frZRFdZGgsos7JKMTnbPBALKDFbo9aEdggfNrVrCxpias9rC");
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
        backgroundColor: "rgba(28, 43, 36, 0.7)",
        backdropFilter: "blur(6px)",
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
          maxWidth: "460px",
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #dfe5dc",
          boxShadow: "0 25px 50px -12px rgba(28, 43, 36, 0.25)",
          padding: "28px",
          position: "relative",
          fontFamily: "'Manrope', sans-serif",
          color: "#1c2b24",
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "8px",
                backgroundColor: vault.color,
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: "18px",
              }}
            >
              {vault.symbol[1]}
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>{vault.symbol} Vault</h2>
              <span style={{ fontSize: "12px", color: "#718078" }}>
                Cycle #{vault.cycle} · {vault.name}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#8a978f",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Live Vault Metrics */}
        <div
          style={{
            backgroundColor: "#f7f9f5",
            borderRadius: "10px",
            padding: "16px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "20px",
            fontSize: "12px",
            border: "1px solid #e7ede5",
          }}
        >
          <div>
            <div style={{ color: "#718078", marginBottom: "4px" }}>CURRENT PRICE</div>
            <strong style={{ fontSize: "16px", color: "#1c2b24" }}>{vault.price}</strong>
          </div>
          <div>
            <div style={{ color: "#718078", marginBottom: "4px" }}>LOCKED STRIKE (+3%)</div>
            <strong style={{ fontSize: "16px", color: "#789f18" }}>{vault.strike}</strong>
          </div>
          <div>
            <div style={{ color: "#718078", marginBottom: "4px" }}>EST. WEEKLY PREMIUM</div>
            <strong style={{ fontSize: "14px", color: "#1c2b24" }}>+{vault.premium}</strong>
          </div>
          <div>
            <div style={{ color: "#718078", marginBottom: "4px" }}>CYCLE STATE</div>
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: "12px",
                backgroundColor: "#eff8d9",
                color: "#668a13",
                fontWeight: 700,
                fontSize: "10px",
              }}
            >
              {vault.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            backgroundColor: "#eef2eb",
            borderRadius: "8px",
            padding: "4px",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() => setTab("deposit")}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "none",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              backgroundColor: tab === "deposit" ? "#ffffff" : "transparent",
              color: tab === "deposit" ? "#1c2b24" : "#718078",
              boxShadow: tab === "deposit" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
            }}
          >
            Deposit xStock
          </button>
          <button
            onClick={() => setTab("claim")}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "none",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              backgroundColor: tab === "claim" ? "#ffffff" : "transparent",
              color: tab === "claim" ? "#1c2b24" : "#718078",
              boxShadow: tab === "claim" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
            }}
          >
            Claim & Position
          </button>
        </div>

        {/* Tab Content: Deposit */}
        {tab === "deposit" ? (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#44574d", marginBottom: "6px" }}>
                Deposit Amount ({vault.symbol})
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #cad6ca",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  backgroundColor: "#fff",
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
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#1c2b24",
                  }}
                  placeholder="1.0"
                />
                <span style={{ fontWeight: 700, fontSize: "13px", color: "#718078", marginLeft: "8px" }}>
                  {vault.symbol}
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "#87948d", marginTop: "4px", display: "block" }}>
                Min deposit: 1.0 token · Est. Value: ~${estimatedUsdValue.toFixed(2)} USD
              </span>
            </div>

            <div
              style={{
                backgroundColor: "#f4f8ec",
                border: "1px solid #ddecbe",
                borderRadius: "8px",
                padding: "12px 14px",
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "12px", color: "#44574d" }}>Weekly Premium Yield:</span>
              <strong style={{ fontSize: "15px", color: "#789f18" }}>+{estimatedPremiumUsdc} USDC</strong>
            </div>

            <button
              onClick={handleDeposit}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#1c2b24",
                color: "#ffffff",
                borderRadius: "8px",
                border: "none",
                fontWeight: 700,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {loading ? (
                "Confirming on Solana..."
              ) : connected ? (
                <>
                  Deposit {amount} {vault.symbol} <span style={{ color: "#d8ff5f" }}>→</span>
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
                backgroundColor: "#f7f9f5",
                borderRadius: "10px",
                padding: "16px",
                marginBottom: "20px",
                border: "1px solid #e7ede5",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", color: "#718078" }}>Deposited Balance:</span>
                <strong style={{ fontSize: "13px" }}>1.0 {vault.symbol}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", color: "#718078" }}>Earned Premium:</span>
                <strong style={{ fontSize: "13px", color: "#789f18" }}>+2.85 USDC</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#718078" }}>Status:</span>
                <strong style={{ fontSize: "12px", color: "#44574d" }}>Ready to Claim</strong>
              </div>
            </div>

            <button
              onClick={handleClaim}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#789f18",
                color: "#ffffff",
                borderRadius: "8px",
                border: "none",
                fontWeight: 700,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Claiming..." : "Claim 1.0 xStock + 2.85 USDC"}
            </button>
          </div>
        )}

        {/* Tx Feedback */}
        {txSignature && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "#eff8d9",
              border: "1px solid #ddecbe",
              fontSize: "12px",
              color: "#44574d",
              wordBreak: "break-all",
            }}
          >
            ✅ <strong>Transaction Confirmed!</strong>
            <div style={{ marginTop: "4px" }}>
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#668a13", textDecoration: "underline", fontWeight: 600 }}
              >
                View on Solana Explorer ↗
              </a>
            </div>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "#ffebee",
              border: "1px solid #ffcdd2",
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
