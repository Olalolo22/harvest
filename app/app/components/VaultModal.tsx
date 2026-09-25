"use client";

import React, { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { VaultItem } from "./Hero";

const PROGRAM_ID = new PublicKey("34Y7acmqWosmkfPJjqRUQzrHFdxmxpQezLSvgD9bLJJo");
const DEVNET_USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

// Devnet vault mint → PDA map (pre-computed for the initialized vault)
const VAULT_MINTS: Record<string, { mint: PublicKey; vaultConfigPDA: PublicKey }> = {
  xNVDA: {
    mint: new PublicKey("EM5uTvQNpeTt4P1vRyfRdvtku42MytZjRsPG7KG4BRqV"),
    vaultConfigPDA: new PublicKey("Gm2yabt5fCMBE6QpYjmt9hEY8nizYMdhqXc9moPG44Qz"),
  },
};

interface VaultModalProps {
  vault: VaultItem | null;
  onClose: () => void;
  onOpenFaucet?: () => void;
}

export default function VaultModal({ vault, onClose, onOpenFaucet }: VaultModalProps) {
  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [tab, setTab] = useState<"deposit" | "claim">("deposit");
  const [amount, setAmount] = useState<string>("1.0");
  const [loading, setLoading] = useState<boolean>(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [xstockBalance, setXstockBalance] = useState<number | null>(null);

  type StrikeProfile = "conservative" | "balanced" | "aggressive";
  const [strikeProfile, setStrikeProfile] = useState<StrikeProfile>("balanced");

  // Lock scroll when open
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  // Fetch user's xStock balance on devnet
  useEffect(() => {
    if (!connected || !publicKey || !vault) return;
    const vaultInfo = VAULT_MINTS[vault.symbol];
    if (!vaultInfo) return;

    (async () => {
      try {
        const ata = getAssociatedTokenAddressSync(
          vaultInfo.mint,
          publicKey,
          false,
          TOKEN_2022_PROGRAM_ID
        );
        const acct = await getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
        setXstockBalance(Number(acct.amount) / 1e8);
      } catch {
        setXstockBalance(0);
      }
    })();
  }, [connected, publicKey, vault, connection]);

  if (!vault) return null;

  const numericAmount = parseFloat(amount) || 0;
  const currentNumericPrice = parseFloat(vault.price.replace("$", "")) || 200;
  const estimatedUsdValue = numericAmount * currentNumericPrice;
  const strikeMultiplier =
    strikeProfile === "conservative" ? 1.04 : strikeProfile === "balanced" ? 1.08 : 1.12;
  const dynamicStrike = `$${(currentNumericPrice * strikeMultiplier).toFixed(2)}`;
  const weeklyYieldRate =
    strikeProfile === "conservative" ? 0.052 : strikeProfile === "balanced" ? 0.084 : 0.121;
  const dynamicPremiumPct =
    strikeProfile === "conservative" ? "5.2%" : strikeProfile === "balanced" ? "8.4%" : "12.1%";
  const estimatedPremiumUsdc = (estimatedUsdValue * (weeklyYieldRate * 0.2)).toFixed(2);

  const handleDeposit = async () => {
    if (!connected || !publicKey) { setVisible(true); return; }
    if (numericAmount < 1.0) { setErrorMsg("Minimum deposit is 1.0 xStock token."); return; }

    const vaultInfo = VAULT_MINTS[vault.symbol];
    if (!vaultInfo) {
      setErrorMsg(`${vault.symbol} vault is not initialized on devnet yet. Try xNVDA.`);
      return;
    }

    if (!signTransaction) { setErrorMsg("Wallet does not support signing."); return; }

    setLoading(true);
    setErrorMsg(null);
    setTxSignature(null);

    try {
      // Fetch live on-chain cycle from VaultConfig account
      let currentCycleBytes = Buffer.from([2, 0, 0, 0, 0, 0, 0, 0]); // devnet cycle 2 default
      try {
        const vaultAcctInfo = await connection.getAccountInfo(vaultInfo.vaultConfigPDA);
        if (vaultAcctInfo && vaultAcctInfo.data.length >= 189) {
          currentCycleBytes = Buffer.from(vaultAcctInfo.data.slice(181, 189));
        }
      } catch (err) {
        console.warn("Using fallback cycle 2 bytes:", err);
      }

      // Derive PDAs
      const [userPositionPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("position"),
          vaultInfo.vaultConfigPDA.toBuffer(),
          publicKey.toBuffer(),
          currentCycleBytes,
        ],
        PROGRAM_ID
      );

      // Get user xStock ATA
      const userXstockAta = getAssociatedTokenAddressSync(
        vaultInfo.mint,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      // Get vault xStock ATA (pre-computed during initialize)
      const vaultXstockAta = getAssociatedTokenAddressSync(
        vaultInfo.mint,
        vaultInfo.vaultConfigPDA,
        true,
        TOKEN_2022_PROGRAM_ID
      );

      // Amount in base units (8 decimals)
      const amountU64 = BigInt(Math.floor(numericAmount * 1e8));

      // Build the deposit instruction manually using the IDL discriminator
      // deposit discriminator = sha256("global:deposit")[0:8]
      // Pre-computed: [242, 35, 198, 137, 82, 225, 242, 182]
      const discriminator = Buffer.from([242, 35, 198, 137, 82, 225, 242, 182]);
      const amountBuf = Buffer.alloc(8);
      amountBuf.writeBigUInt64LE(amountU64);
      const data = Buffer.concat([discriminator, amountBuf]);

      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      const tx = new Transaction();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;
      tx.add({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: vaultInfo.vaultConfigPDA, isSigner: false, isWritable: true },
          { pubkey: vaultInfo.mint, isSigner: false, isWritable: false },
          { pubkey: userXstockAta, isSigner: false, isWritable: true },
          { pubkey: vaultXstockAta, isSigner: false, isWritable: true },
          { pubkey: userPositionPDA, isSigner: false, isWritable: true },
          { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      const signed = await signTransaction(tx);
      const rawTx = signed.serialize();
      const sig = await connection.sendRawTransaction(rawTx, { skipPreflight: false });
      await connection.confirmTransaction(sig, "confirmed");
      setTxSignature(sig);

      // Refresh balance
      try {
        const acct = await getAccount(connection, userXstockAta, "confirmed", TOKEN_2022_PROGRAM_ID);
        setXstockBalance(Number(acct.amount) / 1e8);
      } catch { /* ignore */ }

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      // Friendly user-facing message
      if (msg.includes("0x1") || msg.includes("insufficient")) {
        setErrorMsg("Insufficient xStock balance. Use the Faucet button to get test tokens.");
      } else if (msg.includes("AccountNotFound") || msg.includes("could not find account")) {
        setErrorMsg("Token account not found. Use the Faucet to get devnet xStock tokens first.");
      } else {
        setErrorMsg(msg.slice(0, 200));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!connected || !publicKey) { setVisible(true); return; }
    if (!signTransaction) { setErrorMsg("Wallet does not support signing."); return; }

    const vaultInfo = VAULT_MINTS[vault.symbol];
    if (!vaultInfo) {
      setErrorMsg(`${vault.symbol} vault claim not available on devnet yet.`);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setTxSignature(null);

    try {
      let currentCycleBytes = Buffer.from([2, 0, 0, 0, 0, 0, 0, 0]);
      try {
        const vaultAcctInfo = await connection.getAccountInfo(vaultInfo.vaultConfigPDA);
        if (vaultAcctInfo && vaultAcctInfo.data.length >= 189) {
          currentCycleBytes = Buffer.from(vaultAcctInfo.data.slice(181, 189));
        }
      } catch (err) {
        console.warn("Using fallback cycle 2 bytes:", err);
      }

      // Derive user position PDA
      const [userPositionPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("position"),
          vaultInfo.vaultConfigPDA.toBuffer(),
          publicKey.toBuffer(),
          currentCycleBytes,
        ],
        PROGRAM_ID
      );

      const userXstockAta = getAssociatedTokenAddressSync(
        vaultInfo.mint,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const vaultXstockAta = getAssociatedTokenAddressSync(
        vaultInfo.mint,
        vaultInfo.vaultConfigPDA,
        true,
        TOKEN_2022_PROGRAM_ID
      );
      const userUsdcAta = getAssociatedTokenAddressSync(
        DEVNET_USDC_MINT,
        publicKey,
        false,
        TOKEN_PROGRAM_ID
      );
      const vaultUsdcAta = getAssociatedTokenAddressSync(
        DEVNET_USDC_MINT,
        vaultInfo.vaultConfigPDA,
        true,
        TOKEN_PROGRAM_ID
      );

      // claim discriminator: sha256("global:claim")[0:8]
      // Pre-computed: [62, 198, 214, 193, 213, 159, 108, 210]
      const discriminator = Buffer.from([62, 198, 214, 193, 213, 159, 108, 210]);

      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      const tx = new Transaction();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;
      tx.add({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: vaultInfo.vaultConfigPDA, isSigner: false, isWritable: true },
          { pubkey: vaultInfo.mint, isSigner: false, isWritable: false },
          { pubkey: vaultXstockAta, isSigner: false, isWritable: true },
          { pubkey: userXstockAta, isSigner: false, isWritable: true },
          { pubkey: vaultUsdcAta, isSigner: false, isWritable: true },
          { pubkey: userUsdcAta, isSigner: false, isWritable: true },
          { pubkey: userPositionPDA, isSigner: false, isWritable: true },
          { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: discriminator,
      });

      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
      await connection.confirmTransaction(sig, "confirmed");
      setTxSignature(sig);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      if (msg.includes("NotClaimable") || msg.includes("6003") || msg.includes("6004")) {
        setErrorMsg("Vault cycle is still active — claim becomes available after the keeper settles on Friday.");
      } else {
        setErrorMsg(msg.slice(0, 200));
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
        backgroundColor: "rgba(21, 21, 21, 0.70)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
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
          maxWidth: "520px",
          maxHeight: "calc(100dvh - 48px)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          backgroundColor: "#FFFFFF",
          borderRadius: "24px",
          border: "1px solid rgba(20, 20, 20, 0.12)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
          padding: "36px 32px",
          position: "relative",
          margin: "auto",
          fontFamily: "var(--font-sans)",
          color: "var(--text-primary)",
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.12em",
              color: vault.color, textTransform: "uppercase", display: "block", marginBottom: "4px",
            }}>
              {vault.status === "Active" ? "🟢 ACTIVE VAULT" : "⬜ OPEN VAULT"}
            </span>
            <h2 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>
              {vault.symbol} · {vault.name}
            </h2>
            {xstockBalance !== null && (
              <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--text-muted)" }}>
                Your balance: <strong style={{ color: "var(--text-primary)" }}>{xstockBalance.toFixed(2)} {vault.symbol}</strong>
                {xstockBalance === 0 && (
                  <button
                    onClick={() => { onClose(); if (onOpenFaucet) onOpenFaucet(); }}
                    style={{ marginLeft: "10px", fontSize: "11px", color: "var(--accent-gold)", cursor: "pointer", background: "none", border: "none", fontWeight: 600, textDecoration: "underline" }}
                  >
                    Get test tokens →
                  </button>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            width: "32px", height: "32px", borderRadius: "50%",
            border: "1px solid var(--border-subtle)", display: "grid",
            placeItems: "center", fontSize: "18px", cursor: "pointer", background: "transparent",
          }}>×</button>
        </div>

        {/* Live price strip */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px",
          backgroundColor: "var(--bg-secondary)", borderRadius: "16px",
          padding: "16px", marginBottom: "24px",
        }}>
          {[
            { label: "ORACLE PRICE", val: vault.price },
            { label: "STRIKE", val: dynamicStrike },
            { label: "WEEKLY YIELD", val: dynamicPremiumPct },
          ].map(({ label, val }) => (
            <div key={label}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "4px" }}>{label}</div>
              <div style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: "4px", backgroundColor: "var(--bg-secondary)", borderRadius: "12px", padding: "4px", marginBottom: "24px" }}>
          {(["deposit", "claim"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setErrorMsg(null); setTxSignature(null); }}
              style={{
                flex: 1, padding: "10px", borderRadius: "9px", border: "none",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
                backgroundColor: tab === t ? "#FFFFFF" : "transparent",
                color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease",
                textTransform: "capitalize",
              }}
            >
              {t === "deposit" ? "Deposit xStock" : "Claim Yield"}
            </button>
          ))}
        </div>

        {tab === "deposit" && (
          <>
            {/* Strike profile */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>STRIKE PROFILE</div>
              <div style={{ display: "flex", gap: "8px" }}>
                {(["conservative", "balanced", "aggressive"] as StrikeProfile[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setStrikeProfile(p)}
                    style={{
                      flex: 1, padding: "10px 6px", borderRadius: "12px", border: "none",
                      fontSize: "11px", fontWeight: 600, cursor: "pointer",
                      backgroundColor: strikeProfile === p ? "var(--text-primary)" : "var(--bg-secondary)",
                      color: strikeProfile === p ? "#FFFFFF" : "var(--text-secondary)",
                      transition: "all 0.15s ease", textTransform: "capitalize",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount input */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>DEPOSIT AMOUNT</label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  step="0.5"
                  style={{
                    width: "100%", padding: "14px 80px 14px 16px", borderRadius: "14px",
                    border: "1.5px solid var(--border-subtle)", fontSize: "16px",
                    fontWeight: 600, fontFamily: "var(--font-sans)", outline: "none",
                    backgroundColor: "#FFFFFF",
                  }}
                />
                <span style={{
                  position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                  fontSize: "12px", fontWeight: 600, color: "var(--text-muted)",
                }}>{vault.symbol}</span>
              </div>
              <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                <span>≈ ${estimatedUsdValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD</span>
                <span>Est. weekly yield: <strong style={{ color: "var(--accent-green)" }}>{estimatedPremiumUsdc} USDC</strong></span>
              </div>
            </div>
          </>
        )}

        {tab === "claim" && (
          <div style={{ padding: "20px", backgroundColor: "var(--bg-secondary)", borderRadius: "16px", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Claims are unlocked by the keeper daemon after vault settlement each Friday at 16:00 EST.
              The keeper fetches Pyth Hermes prices, computes OTM/ITM outcome, and unlocks your position.
            </div>
            <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>EXPECTED OUTCOME</div>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>Principal + USDC Premium</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>VAULT STATUS</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: vault.status === "Active" ? "var(--accent-green)" : "var(--text-primary)" }}>{vault.status}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action button */}
        <button
          onClick={tab === "deposit" ? handleDeposit : handleClaim}
          disabled={loading}
          style={{
            width: "100%", height: "52px",
            backgroundColor: connected ? "var(--text-primary)" : "var(--bg-secondary)",
            color: connected ? "#FFFFFF" : "var(--text-secondary)",
            borderRadius: "999px", border: "none", fontWeight: 700,
            fontSize: "15px", cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            opacity: loading ? 0.7 : 1, transition: "all 0.15s ease",
          }}
        >
          {loading ? (
            <>
              <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
              {tab === "deposit" ? "Sending transaction…" : "Submitting claim…"}
            </>
          ) : !connected ? (
            "Connect Wallet to Continue"
          ) : tab === "deposit" ? (
            `Deposit ${numericAmount || "—"} ${vault.symbol} →`
          ) : (
            "Claim Yield & Principal →"
          )}
        </button>

        {/* Faucet nudge */}
        {tab === "deposit" && (
          <div style={{ marginTop: "12px", textAlign: "center" }}>
            <button
              onClick={() => { onClose(); if (onOpenFaucet) onOpenFaucet(); }}
              style={{ fontSize: "12px", color: "var(--text-muted)", cursor: "pointer", background: "none", border: "none" }}
            >
              No {vault.symbol} yet? <strong style={{ color: "var(--accent-gold)" }}>Get test tokens from the Faucet →</strong>
            </button>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div style={{
            marginTop: "16px", padding: "14px", borderRadius: "12px",
            backgroundColor: "rgba(220, 53, 69, 0.08)", border: "1px solid rgba(220, 53, 69, 0.2)",
            fontSize: "13px", color: "#dc3545",
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Success */}
        {txSignature && (
          <div style={{
            marginTop: "16px", padding: "14px", borderRadius: "12px",
            backgroundColor: "rgba(108, 156, 66, 0.1)", border: "1px solid rgba(108, 156, 66, 0.25)",
            fontSize: "13px", color: "var(--accent-green)",
          }}>
            ✅ <strong>Transaction confirmed!</strong>
            <div style={{ marginTop: "6px" }}>
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", wordBreak: "break-all", textDecoration: "underline" }}
              >
                View on Solana Explorer ↗
              </a>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
