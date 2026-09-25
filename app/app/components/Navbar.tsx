"use client";

import React, { useState, useEffect } from "react";
import styles from "../design-v2.module.css";
import ConnectWalletButton from "./ConnectWalletButton";

interface NavbarProps {
  onOpenPortfolio?: () => void;
  onOpenFaucet?: () => void;
}

export default function Navbar({ onOpenPortfolio, onOpenFaucet }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={styles.navbarWrapper}
      style={{
        borderBottomColor: scrolled ? "rgba(20, 20, 20, 0.1)" : "rgba(20, 20, 20, 0.05)",
      }}
    >
      <div className={styles.container}>
        <nav className={styles.navbar} aria-label="Main navigation">
          <a href="#top" className={styles.brand}>
            <span className={styles.brandMark}>H</span>
            <span>HARVEST</span>
            <span className={styles.brandSub}>v2</span>
          </a>

          <div className={styles.navLinks}>
            <a href="#how-it-works" className={styles.navLink}>
              How it works
            </a>
            <a href="#vaults" className={styles.navLink}>
              Vaults
            </a>
            <a href="#strategy" className={styles.navLink}>
              Strategy
            </a>
            <a href="#settlement-history" className={styles.navLink}>
              Crank &amp; Cycles
            </a>
            <a href="#risks" className={styles.navLink}>
              Risks
            </a>
          </div>

          <div className={styles.navActions}>
            {onOpenFaucet && (
              <button
                type="button"
                onClick={onOpenFaucet}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  height: "42px",
                  padding: "0 14px",
                  borderRadius: "999px",
                  border: "1px solid rgba(216, 168, 78, 0.4)",
                  backgroundColor: "rgba(216, 168, 78, 0.08)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "var(--accent-gold)",
                  transition: "background-color 0.15s ease",
                  fontFamily: "var(--font-mono)",
                }}
                title="Mint test xStocks and USDC on Devnet"
              >
                <span>Faucet ↗</span>
              </button>
            )}
            {onOpenPortfolio && (
              <button
                type="button"
                onClick={onOpenPortfolio}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  height: "42px",
                  padding: "0 16px",
                  borderRadius: "999px",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "rgba(20, 20, 20, 0.03)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  transition: "background-color 0.15s ease",
                }}
                title="View active vault positions"
              >
                <span>Portfolio</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    background: "var(--accent-gold-soft)",
                    color: "var(--accent-gold)",
                    padding: "1px 6px",
                    borderRadius: "999px",
                  }}
                >
                  2
                </span>
              </button>
            )}
            <ConnectWalletButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
