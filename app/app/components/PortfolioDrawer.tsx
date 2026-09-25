"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

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
  isRealOnChain?: boolean;
}

interface PortfolioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeposit?: (symbol: string) => void;
  onOpenFaucet?: () => void;
}

const PROGRAM_ID = new PublicKey("34Y7acmqWosmkfPJjqRUQzrHFdxmxpQezLSvgD9bLJJo");
const VAULT_CONFIG = new PublicKey("Gm2yabt5fCMBE6QpYjmt9hEY8nizYMdhqXc9moPG44Qz");
const XNVDA_MINT = new PublicKey("EM5uTvQNpeTt4P1vRyfRdvtku42MytZjRsPG7KG4BRqV");
const USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

export default function PortfolioDrawer({ isOpen, onClose, onOpenDeposit, onOpenFaucet }: PortfolioDrawerProps) {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const [solBal, setSolBal] = useState<number>(0);
  const [xnvdaBal, setXnvdaBal] = useState<number>(0);
  const [usdcBal, setUsdcBal] = useState<number>(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  const fetchOnChainData = useCallback(async () => {
    if (!connected || !publicKey) {
      setPositions([]);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch SOL
      const lamports = await connection.getBalance(publicKey, "confirmed");
      setSolBal(lamports / LAMPORTS_PER_SOL);

      // 2. Fetch xNVDA (Token-2022)
      try {
        const xnvdaAta = getAssociatedTokenAddressSync(
          XNVDA_MINT,
          publicKey,
          false,
          TOKEN_2022_PROGRAM_ID
        );
        const acct = await getAccount(connection, xnvdaAta, "confirmed", TOKEN_2022_PROGRAM_ID);
        setXnvdaBal(Number(acct.amount) / 1e8);
      } catch {
        setXnvdaBal(0);
      }

      // 3. Fetch USDC
      try {
        const usdcAta = getAssociatedTokenAddressSync(
          USDC_MINT,
          publicKey,
          false,
          TOKEN_PROGRAM_ID
        );
        const acct = await getAccount(connection, usdcAta, "confirmed", TOKEN_PROGRAM_ID);
        setUsdcBal(Number(acct.amount) / 1e6);
      } catch {
        setUsdcBal(0);
      }

      // 4. Check on-chain UserPosition for cycle 1 and cycle 2
      const foundPositions: Position[] = [];
      for (const cycleNum of [1, 2]) {
        try {
          const cycleBuf = Buffer.alloc(8);
          cycleBuf.writeBigUInt64LE(BigInt(cycleNum));
          const [posPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("position"), VAULT_CONFIG.toBuffer(), publicKey.toBuffer(), cycleBuf],
            PROGRAM_ID
          );
          const posInfo = await connection.getAccountInfo(posPDA, "confirmed");
          if (posInfo && posInfo.data.length >= 105) {
            const rawAmount = posInfo.data.readBigUInt64LE(72);
            const state = posInfo.data.readUInt8(104);
            const amt = Number(rawAmount) / 1e8;
            if (amt > 0) {
              foundPositions.push({
                symbol: "xNVDA",
                name: "NVIDIA Corporation",
                amount: amt,
                currentPrice: 213.9,
                strikePrice: 220.32,
                weeklyPremiumUsdc: Number((amt * 213.9 * 0.084).toFixed(2)),
                cycle: cycleNum,
                daysRemaining: cycleNum === 2 ? "Active (Expires Friday)" : "Settled",
                status: state === 1 ? "Settled" : cycleNum === 1 ? "Claimable" : "Active",
                isRealOnChain: true,
              });
            }
          }
        } catch {
          // ignore error per cycle
        }
      }

      setPositions(foundPositions);
    } catch (e) {
      console.warn("Error fetching portfolio:", e);
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, connection]);

  useEffect(() => {
    if (isOpen) {
      fetchOnChainData();
    }
  }, [isOpen, fetchOnChainData]);

  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalDepositedUsd = positions.reduce(
    (acc: number, p: Position) => acc + p.amount * p.currentPrice,
    0
  );
  const totalAccruedPremium = positions.reduce(
    (acc: number, p: Position) => acc + p.weeklyPremiumUsdc,
    0
  );

  const truncatedAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "Not Connected";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 12, 8, 0.75)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
        overflow: "hidden",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "490px",
          height: "100dvh",
          backgroundColor: "#FFFFFF",
          borderLeft: "1px solid rgba(20, 20, 20, 0.12)",
          boxShadow: "-16px 0 40px rgba(0, 0, 0, 0.2)",
          padding: "32px 28px 48px 28px",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          fontFamily: "var(--font-sans)",
          color: "var(--text-primary)",
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
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
              SOLANA DEVNET PORTFOLIO
            </span>
            <h2 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>
              Your Positions
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
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: "16px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Connected Wallet Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--bg-primary)",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid var(--border-subtle)",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: connected ? "var(--accent-green)" : "#e23636",
                boxShadow: connected ? "0 0 8px var(--accent-green)" : "none",
              }}
            />
            <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              {truncatedAddress}
            </span>
          </div>

          {!connected ? (
            <button
              onClick={() => setVisible(true)}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--accent-gold)",
                cursor: "pointer",
              }}
            >
              Connect →
            </button>
          ) : (
            <button
              onClick={fetchOnChainData}
              disabled={loading}
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "2px 6px",
              }}
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          )}
        </div>

        {/* Wallet Balances Card */}
        <div
          style={{
            padding: "16px",
            borderRadius: "16px",
            backgroundColor: "var(--bg-secondary)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "12px",
            }}
          >
            On-Chain Wallet Balances
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <div style={{ backgroundColor: "#FFFFFF", padding: "10px", borderRadius: "10px" }}>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Devnet SOL</div>
              <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {solBal.toFixed(3)}
              </div>
            </div>
            <div style={{ backgroundColor: "#FFFFFF", padding: "10px", borderRadius: "10px" }}>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>xNVDA</div>
              <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {xnvdaBal.toFixed(2)}
              </div>
            </div>
            <div style={{ backgroundColor: "#FFFFFF", padding: "10px", borderRadius: "10px" }}>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>USDC</div>
              <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {usdcBal.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Aggregate Yield Summary */}
        <div
          style={{
            backgroundColor: "var(--bg-dark)",
            borderRadius: "18px",
            padding: "20px",
            color: "#FFFFFF",
            marginBottom: "24px",
          }}
        >
          <div style={{ fontSize: "11px", color: "var(--text-dark-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
            Total Collateral Locked
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", fontFamily: "var(--font-mono)" }}>
            ${totalDepositedUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--text-dark-secondary)" }}>Est. Friday USDC Yield</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}>
              +${totalAccruedPremium.toFixed(2)} USDC
            </span>
          </div>
        </div>

        {/* Positions Section Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
            }}
          >
            ACTIVE VAULT POSITIONS ({positions.length})
          </span>
        </div>

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
        {positions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "28px" }}>
            {positions.map((pos: Position) => (
              <div
                key={`${pos.symbol}-${pos.cycle}`}
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "16px",
                  padding: "16px",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div>
                    <strong style={{ fontSize: "15px" }}>{pos.symbol} Vault</strong>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      Cycle #{pos.cycle} · {pos.amount} xStock locked
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      fontWeight: 600,
                      backgroundColor: pos.status === "Active" ? "rgba(108, 156, 66, 0.12)" : "rgba(216, 168, 78, 0.15)",
                      color: pos.status === "Active" ? "var(--accent-green)" : "var(--accent-gold)",
                    }}
                  >
                    {pos.status}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px", backgroundColor: "var(--bg-primary)", padding: "10px", borderRadius: "10px" }}>
                  <div>
                    <span style={{ color: "var(--text-secondary)" }}>OTM Strike: </span>
                    <strong style={{ fontFamily: "var(--font-mono)" }}>${pos.strikePrice.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)" }}>Weekly Premium: </span>
                    <strong style={{ color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}>+${pos.weeklyPremiumUsdc}</strong>
                  </div>
                </div>

                {pos.status === "Claimable" && (
                  <button
                    onClick={() => {
                      if (onOpenDeposit) {
                        onClose();
                        onOpenDeposit(pos.symbol);
                      }
                    }}
                    style={{
                      marginTop: "12px",
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      backgroundColor: "var(--accent-green)",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Claim Yield &amp; Collateral →
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "32px 20px",
              borderRadius: "16px",
              border: "1px dashed var(--border-subtle)",
              textAlign: "center",
              marginBottom: "28px",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>🌾</div>
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
              No active deposits found
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px", maxWidth: "280px", margin: "0 auto 16px auto" }}>
              Deposit tokenized equities into a vault to start earning weekly USDC covered-call yield.
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              {onOpenDeposit && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenDeposit("xNVDA");
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "999px",
                    backgroundColor: "var(--text-primary)",
                    color: "#FFFFFF",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Deposit xNVDA →
                </button>
              )}
              {onOpenFaucet && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenFaucet();
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "999px",
                    border: "1px solid var(--border-subtle)",
                    backgroundColor: "#FFFFFF",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Devnet Faucet ↗
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
