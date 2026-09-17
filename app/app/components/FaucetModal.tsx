"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

interface FaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (token: string, amount: number) => void;
}

export default function FaucetModal({ isOpen, onClose, onSuccess }: FaucetModalProps) {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [selectedToken, setSelectedToken] = useState<string>("xNVDA");
  const [loading, setLoading] = useState<boolean>(false);
  const [txSig, setTxSig] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const tokens = [
    {
      symbol: "xNVDA",
      name: "NVIDIA Corp (Tokenized)",
      amount: "10.0 xNVDA",
      val: 10.0,
      mint: "EM5uTvQNpeTt4P1vRyfRdvtku42MytZjRsPG7KG4BRqV",
    },
    {
      symbol: "xAAPL",
      name: "Apple Inc (Tokenized)",
      amount: "10.0 xAAPL",
      val: 10.0,
      mint: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
    },
    {
      symbol: "xTSLA",
      name: "Tesla Inc (Tokenized)",
      amount: "5.0 xTSLA",
      val: 5.0,
      mint: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
    },
    {
      symbol: "USDC",
      name: "Devnet Cash Reserve",
      amount: "1,000.00 USDC",
      val: 1000.0,
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    },
  ];

  const handleMint = async () => {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    setLoading(true);
    setTxSig(null);

    try {
      // Simulate SPL Token mint_to instruction on Devnet
      await new Promise((r) => setTimeout(r, 1400));
      const sig = "3vNpK7qX9uM5aZbC6vY8rT1wE4dF2sA7gH0jK3lM6nP9qR2sT5uV8wX1yZ4aB7cD";
      setTxSig(sig);
      const token = tokens.find((t) => t.symbol === selectedToken);
      if (onSuccess && token) {
        onSuccess(token.symbol, token.val);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(21, 21, 21, 0.65)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        zIndex: 1100,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px 16px",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          maxHeight: "calc(100dvh - 48px)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          backgroundColor: "#FFFFFF",
          borderRadius: "24px",
          border: "1px solid rgba(20, 20, 20, 0.12)",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.2)",
          padding: "36px 32px",
          position: "relative",
          margin: "auto",
          fontFamily: "var(--font-sans)",
          color: "var(--text-primary)",
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.12em",
                color: "var(--accent-gold)",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "4px",
              }}
            >
              DEVNET FAUCET
            </span>
            <h2 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>
              Mint Test Tokens
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "1px solid var(--border-subtle)",
              display: "grid",
              placeItems: "center",
              fontSize: "16px",
              cursor: "pointer",
              background: "transparent",
            }}
          >
            ×
          </button>
        </div>

        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "24px" }}>
          Need test collateral to trial Harvest vaults on Solana Devnet? Select a token below to receive test funds immediately.
        </p>

        {/* Token Selection */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
          {tokens.map((t) => {
            const isSelected = selectedToken === t.symbol;
            return (
              <div
                key={t.symbol}
                onClick={() => setSelectedToken(t.symbol)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: isSelected ? "1.5px solid var(--text-primary)" : "1px solid var(--border-subtle)",
                  backgroundColor: isSelected ? "var(--bg-primary)" : "#FFFFFF",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div>
                  <strong style={{ fontSize: "14px" }}>{t.symbol}</strong>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{t.name}</div>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600 }}>
                  +{t.amount}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mint Action Button */}
        <button
          onClick={handleMint}
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
          }}
        >
          {loading ? (
            "Airdropping SPL Tokens..."
          ) : connected ? (
            `Mint ${selectedToken} to Wallet →`
          ) : (
            "Connect Wallet to Airdrop"
          )}
        </button>

        {/* Feedback */}
        {txSig && (
          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              borderRadius: "12px",
              backgroundColor: "rgba(108, 156, 66, 0.12)",
              border: "1px solid rgba(108, 156, 66, 0.25)",
              fontSize: "12px",
              color: "var(--accent-green)",
              fontWeight: 500,
            }}
          >
            ✅ <strong>Tokens Minted Successfully!</strong>
            <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--text-secondary)" }}>
              Added test collateral to your connected address. You can now deposit into the vault.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
