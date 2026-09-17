"use client";

import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import styles from "../page.module.css";

export default function ConnectWalletButton() {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected && publicKey) {
    const base58 = publicKey.toBase58();
    const truncated = `${base58.slice(0, 4)}...${base58.slice(-4)}`;

    return (
      <button
        onClick={() => disconnect()}
        className={styles.navCta}
        title="Click to disconnect"
        style={{ cursor: "pointer", border: "none" }}
      >
        <span>●</span> {truncated}
      </button>
    );
  }

  return (
    <button
      onClick={() => setVisible(true)}
      className={styles.navCta}
      style={{ cursor: "pointer", border: "none" }}
    >
      Connect wallet <span>↗</span>
    </button>
  );
}
