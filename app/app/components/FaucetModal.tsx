"use client";

import React, { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

interface FaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (token: string, amount: number) => void;
}

const DEVNET_XNVDA_MINT = new PublicKey("EM5uTvQNpeTt4P1vRyfRdvtku42MytZjRsPG7KG4BRqV");
const DEVNET_USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

export default function FaucetModal({ isOpen, onClose, onSuccess }: FaucetModalProps) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const [activeTab, setActiveTab] = useState<"sol" | "tokens">("sol");
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [xnvdaBalance, setXnvdaBalance] = useState<number | null>(null);
  const [loadingSol, setLoadingSol] = useState<boolean>(false);
  const [loadingAta, setLoadingAta] = useState<boolean>(false);
  const [solTxSig, setSolTxSig] = useState<string | null>(null);
  const [solError, setSolError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [ataSuccess, setAtaSuccess] = useState<string | null>(null);

  // Fetch balances on open and wallet change
  const refreshBalances = async () => {
    if (!connected || !publicKey) return;
    try {
      const lamports = await connection.getBalance(publicKey, "confirmed");
      setSolBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      setSolBalance(null);
    }

    try {
      const xnvdaAta = getAssociatedTokenAddressSync(
        DEVNET_XNVDA_MINT,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const acct = await getAccount(connection, xnvdaAta, "confirmed", TOKEN_2022_PROGRAM_ID);
      setXnvdaBalance(Number(acct.amount) / 1e8);
    } catch {
      setXnvdaBalance(0);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshBalances();
    }
  }, [isOpen, connected, publicKey]);

  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestSol = async () => {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    setLoadingSol(true);
    setSolError(null);
    setSolTxSig(null);

    try {
      const sig = await connection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL);
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction({ signature: sig, ...latestBlockhash }, "confirmed");
      setSolTxSig(sig);
      await refreshBalances();
    } catch (err: unknown) {
      console.warn("Devnet airdrop failed:", err);
      setSolError(
        "Devnet public RPC rate limit reached. Use official faucets below with your address."
      );
    } finally {
      setLoadingSol(false);
    }
  };

  const handleInitAta = async () => {
    if (!connected || !publicKey || !sendTransaction) {
      setVisible(true);
      return;
    }

    setLoadingAta(true);
    setAtaSuccess(null);

    try {
      const xnvdaAta = getAssociatedTokenAddressSync(
        DEVNET_XNVDA_MINT,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const usdcAta = getAssociatedTokenAddressSync(
        DEVNET_USDC_MINT,
        publicKey,
        false,
        TOKEN_PROGRAM_ID
      );

      const tx = new Transaction().add(
        createAssociatedTokenAccountIdempotentInstruction(
          publicKey,
          xnvdaAta,
          publicKey,
          DEVNET_XNVDA_MINT,
          TOKEN_2022_PROGRAM_ID
        ),
        createAssociatedTokenAccountIdempotentInstruction(
          publicKey,
          usdcAta,
          publicKey,
          DEVNET_USDC_MINT,
          TOKEN_PROGRAM_ID
        )
      );

      const sig = await sendTransaction(tx, connection);
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction({ signature: sig, ...latestBlockhash }, "confirmed");
      setAtaSuccess(sig);
      await refreshBalances();
      if (onSuccess) {
        onSuccess("xNVDA", 10.0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initialize accounts";
      console.error(err);
      setSolError(msg.slice(0, 160));
    } finally {
      setLoadingAta(false);
    }
  };

  const copyAddress = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey.toBase58());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 12, 8, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 1100,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px 16px",
        overflowY: "auto",
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
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
          padding: "32px 28px",
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
              SOLANA DEVNET
            </span>
            <h2 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>
              Testnet Faucet
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

        {/* Tab switch */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            backgroundColor: "var(--bg-secondary)",
            padding: "4px",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() => setActiveTab("sol")}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              backgroundColor: activeTab === "sol" ? "#FFFFFF" : "transparent",
              color: activeTab === "sol" ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: activeTab === "sol" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              cursor: "pointer",
            }}
          >
            Devnet SOL (Gas)
          </button>
          <button
            onClick={() => setActiveTab("tokens")}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              backgroundColor: activeTab === "tokens" ? "#FFFFFF" : "transparent",
              color: activeTab === "tokens" ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: activeTab === "tokens" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              cursor: "pointer",
            }}
          >
            xStock &amp; USDC Collateral
          </button>
        </div>

        {/* Connected Wallet Info */}
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "12px",
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-subtle)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Connected Wallet
            </div>
            <div style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-mono)", marginTop: "2px" }}>
              {connected && publicKey
                ? `${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}`
                : "Not connected"}
            </div>
          </div>
          {connected && publicKey ? (
            <button
              onClick={copyAddress}
              style={{
                fontSize: "12px",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle)",
                backgroundColor: "#FFFFFF",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          ) : (
            <button
              onClick={() => setVisible(true)}
              style={{
                fontSize: "12px",
                padding: "6px 12px",
                borderRadius: "6px",
                backgroundColor: "var(--text-primary)",
                color: "#FFFFFF",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Connect
            </button>
          )}
        </div>

        {/* TAB 1: SOL Airdrop */}
        {activeTab === "sol" && (
          <div>
            <div style={{ marginBottom: "16px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Solana Devnet requires SOL to pay for transaction fees and rent for Token-2022 vault accounts.
            </div>

            <div
              style={{
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Current Devnet SOL</span>
              <span style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {solBalance !== null ? `${solBalance.toFixed(4)} SOL` : "—"}
              </span>
            </div>

            <button
              onClick={handleRequestSol}
              disabled={loadingSol}
              style={{
                width: "100%",
                height: "48px",
                backgroundColor: "var(--text-primary)",
                color: "#FFFFFF",
                borderRadius: "999px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: loadingSol ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              {loadingSol ? "Requesting 1 SOL from Devnet..." : "Request 1 Devnet SOL →"}
            </button>

            {solTxSig && (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(108, 156, 66, 0.12)",
                  border: "1px solid rgba(108, 156, 66, 0.3)",
                  fontSize: "12px",
                  color: "var(--accent-green)",
                  marginBottom: "16px",
                }}
              >
                ✅ <strong>1 SOL airdropped!</strong>
                <div>
                  <a
                    href={`https://explorer.solana.com/tx/${solTxSig}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: "underline", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                  >
                    View on Solana Explorer ↗
                  </a>
                </div>
              </div>
            )}

            {solError && (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(216, 168, 78, 0.12)",
                  border: "1px solid rgba(216, 168, 78, 0.3)",
                  fontSize: "12px",
                  color: "#926815",
                  marginBottom: "16px",
                  lineHeight: 1.4,
                }}
              >
                ⚠️ {solError}
                <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <a
                    href="https://faucet.solana.com"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.1)",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    faucet.solana.com ↗
                  </a>
                  <a
                    href="https://solfaucet.com"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.1)",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    solfaucet.com ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Token Collateral */}
        {activeTab === "tokens" && (
          <div>
            <div style={{ marginBottom: "16px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Harvest vaults use Token-2022 xStock tokens as collateral and receive USDC premium.
            </div>

            <div
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1px solid var(--border-subtle)",
                marginBottom: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>xNVDA (Token-2022)</div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    EM5u...BRqV (8 decimals)
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "14px" }}>
                  {xnvdaBalance !== null ? `${xnvdaBalance.toFixed(2)} xNVDA` : "0.00"}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1px solid var(--border-subtle)",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>USDC (Circle Devnet)</div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    Gh9Z...KGtK (6 decimals)
                  </div>
                </div>
                <a
                  href="https://faucet.circle.com/"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--accent-gold)",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  Circle Faucet ↗
                </a>
              </div>
            </div>

            <button
              onClick={handleInitAta}
              disabled={loadingAta}
              style={{
                width: "100%",
                height: "48px",
                backgroundColor: "var(--text-primary)",
                color: "#FFFFFF",
                borderRadius: "999px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: loadingAta ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "14px",
              }}
            >
              {loadingAta ? "Setting up Devnet Accounts..." : "Initialize Devnet Token Accounts →"}
            </button>

            {ataSuccess && (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(108, 156, 66, 0.12)",
                  border: "1px solid rgba(108, 156, 66, 0.3)",
                  fontSize: "12px",
                  color: "var(--accent-green)",
                }}
              >
                ✅ <strong>Token accounts initialized on Devnet!</strong>
                <div>Ready for deposits into the Harvest vault.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
