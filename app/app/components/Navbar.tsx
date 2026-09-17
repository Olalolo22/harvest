"use client";

import React, { useState, useEffect } from "react";
import styles from "../design-v2.module.css";
import ConnectWalletButton from "./ConnectWalletButton";

export default function Navbar() {
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
            <a href="#risks" className={styles.navLink}>
              Risks
            </a>
          </div>

          <div className={styles.navActions}>
            <ConnectWalletButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
