"use client";

import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

interface ConnectWalletButtonProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function ConnectWalletButton({ className, style }: ConnectWalletButtonProps) {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const defaultStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    height: "42px",
    padding: "0 18px",
    borderRadius: "999px",
    border: "1px solid rgba(20, 20, 20, 0.14)",
    backgroundColor: "#FFFFFF",
    color: "#171717",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    transition: "all 0.15s ease",
    ...style,
  };

  if (connected && publicKey) {
    const base58 = publicKey.toBase58();
    const truncated = `${base58.slice(0, 4)}...${base58.slice(-4)}`;

    return (
      <button
        onClick={() => disconnect()}
        className={className}
        style={{
          ...defaultStyle,
          borderColor: "rgba(108, 156, 66, 0.4)",
          backgroundColor: "rgba(108, 156, 66, 0.08)",
          color: "#466b26",
          fontFamily: "var(--font-mono)",
        }}
        title="Click to disconnect wallet"
      >
        <span style={{ fontSize: "9px" }}>●</span> {truncated}
      </button>
    );
  }

  return (
    <button
      onClick={() => setVisible(true)}
      className={className}
      style={defaultStyle}
    >
      Connect wallet <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>↗</span>
    </button>
  );
}
