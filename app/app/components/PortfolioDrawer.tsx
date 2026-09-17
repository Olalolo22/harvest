"use client";

import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

interface Position {
  symbol: string;
  name: string;
  amount: number;
  currentPrice: number;
  strikePrice: number;
  weeklyPremiumUsdc: number;
  cycle: number;
  daysRemaining: string;
  status: "Active" | "Claimable" | "Settled";
}

interface PortfolioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PortfolioDrawer({ isOpen, onClose }: PortfolioDrawerProps) {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  // Simulated positions for connected wallet (can be funded via Devnet Faucet)
  const [positions, setPositions] = useState<Position[]>([
    {
      symbol: "xNVDA",
      name: "NVIDIA Corporation",
      amount: 10.0,
      currentPrice: 213.9,
      strikePrice: 225.0,
      weeklyPremiumUsdc: 179.68,
      cycle: 2,
      daysRemaining: "4d 12h",
      status: "Active",
    },
    {
      symbol: "xAAPL",
      name: "Apple Inc.",
      amount: 5.0,
      currentPrice: 228.71,
      strikePrice: 235.5,
      weeklyPremiumUsdc: 77.76,
      cycle: 1,
      daysRemaining: "4d 12h",
      status: "Active",
    },
  ]);

  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalDepositedUsd = positions.reduce(
    (acc: number, p: Position) => acc + p.amount * p.currentPrice,
    0
  );
  const totalAccruedPremium = positions.reduce(
    (acc: number, p: Position) => acc + p.weeklyPremiumUsdc,
    0
  );

  const handleClaim = async (symbol: string) => {
    setClaiming(symbol);
    setClaimedNotice(null);
    await new Promise((r) => setTimeout(r, 1200));
    setClaiming(null);
    setClaimedNotice(`Successfully claimed yield for ${symbol}!`);
    setTimeout(() => setClaimedNotice(null), 4000);
  };

  const truncatedAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "Devnet Demo Wallet";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(21, 21, 21, 0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "490px",
          height: "100%",
          backgroundColor: "#FFFFFF",
          borderLeft: "1px solid rgba(20, 20, 20, 0.12)",
          boxShadow: "-16px 0 40px rgba(0, 0, 0, 0.12)",
          padding: "36px 32px",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          fontFamily: "var(--font-sans)",
          color: "var(--text-primary)",
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.14em",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              MY HARVEST
            </div>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                margin: 0,
              }}
            >
              Portfolio & Positions
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1px solid var(--border-subtle)",
              display: "grid",
              placeItems: "center",
              fontSize: "18px",
              cursor: "pointer",
              color: "var(--text-secondary)",
              background: "transparent",
            }}
            aria-label="Close portfolio drawer"
          >
            ×
          </button>
        </div>

        {/* Wallet Status Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderRadius: "12px",
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-subtle)",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                backgroundColor: connected ? "var(--accent-green)" : "var(--accent-gold)",
              }}
            />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>
              {connected ? truncatedAddress : "Demo Mode (Not Connected)"}
            </span>
          </div>

          {!connected && (
            <button
              onClick={() => setVisible(true)}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--accent-gold)",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Connect Wallet ↗
            </button>
          )}
        </div>

        {/* Metric Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Total Collateral
            </span>
            <strong
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
              }}
            >
              ${totalDepositedUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>

          <div
            style={{
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Est. Weekly Yield
            </span>
            <strong
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--accent-green)",
              }}
            >
              +${totalAccruedPremium.toFixed(2)} USDC
            </strong>
          </div>
        </div>

        {/* Positions Section Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            ACTIVE VAULT POSITIONS ({positions.length})
          </span>
        </div>

        {/* Notification message */}
        {claimedNotice && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              backgroundColor: "rgba(108, 156, 66, 0.12)",
              border: "1px solid rgba(108, 156, 66, 0.25)",
              color: "var(--accent-green)",
              fontSize: "12px",
              marginBottom: "16px",
              fontWeight: 500,
            }}
          >
            ✅ {claimedNotice}
          </div>
        )}

        {/* Positions List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
          {positions.map((pos) => {
            const pctUnderStrike = (((pos.strikePrice - pos.currentPrice) / pos.strikePrice) * 100).toFixed(1);

            return (
              <div
                key={pos.symbol}
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "16px",
                  padding: "20px",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "16px", letterSpacing: "-0.02em" }}>
                      {pos.symbol} Vault
                    </strong>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Cycle #{pos.cycle} · {pos.amount} tokens locked
                    </div>
                  </div>

                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.08em",
                      padding: "3px 8px",
                      borderRadius: "999px",
                      backgroundColor: "rgba(108, 156, 66, 0.12)",
                      color: "var(--accent-green)",
                      fontWeight: 600,
                    }}
                  >
                    {pos.status.toUpperCase()}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    padding: "12px 0",
                    borderTop: "1px solid var(--border-subtle)",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontSize: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Est. Premium:</span>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--accent-green)" }}>
                      +${pos.weeklyPremiumUsdc.toFixed(2)} USDC
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Strike Buffer:</span>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      +{pctUnderStrike}% to strike (${pos.strikePrice})
                    </div>
                  </div>
                </div>

                {/* Risk / Outcome status gauge */}
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      marginBottom: "6px",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>Exercise Risk</span>
                    <span style={{ color: "var(--accent-green)", fontWeight: 600 }}>Safe (OTM)</span>
                  </div>
                  <div
                    style={{
                      height: "5px",
                      backgroundColor: "var(--bg-primary)",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "35%",
                        height: "100%",
                        backgroundColor: "var(--accent-green)",
                        borderRadius: "3px",
                      }}
                    />
                  </div>
                </div>

                {/* Action button */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => handleClaim(pos.symbol)}
                    disabled={claiming === pos.symbol}
                    style={{
                      flex: 1,
                      height: "38px",
                      borderRadius: "8px",
                      backgroundColor: "var(--text-primary)",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: claiming === pos.symbol ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    {claiming === pos.symbol ? "Claiming..." : "Claim Yield"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info in drawer */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "20px",
            borderTop: "1px solid var(--border-subtle)",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}
        >
          Cycles settle automatically every Friday at 16:00 UTC via Pyth Oracle on Solana Devnet.
        </div>
      </div>
    </div>
  );
}
