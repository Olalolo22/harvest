"use client";

import React, { useState, type CSSProperties } from "react";
import Image from "next/image";
import { MobileMenu } from "./MobileMenu";
import { MotionController } from "./MotionController";
import styles from "./page.module.css";

import ConnectWalletButton from "./components/ConnectWalletButton";
import PayoffVisualizer from "./components/PayoffVisualizer";
import KeeperLedgerModal from "./components/KeeperLedgerModal";
import VaultModal from "./components/VaultModal";
import PortfolioDrawer from "./components/PortfolioDrawer";
import FaucetModal from "./components/FaucetModal";
import { VaultItem } from "./components/Hero";
import { usePythPrices } from "./hooks/usePythPrices";

const navigation = [
  { label: "Protocol", href: "#protocol" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Vaults", href: "#markets" },
  { label: "Crank & Ledger", href: "#crank" },
  { label: "About", href: "#about" },
];

const steps = [
  {
    number: "01",
    title: "Deposit",
    copy: "Deposit xStocks into a Token-2022 vault during its deposit window. Your position is recorded in an on-chain PDA.",
  },
  {
    number: "02",
    title: "Lock the cycle",
    copy: "The keeper captures the Pyth Hermes spot price, sets an out-of-the-money strike, and locks the weekly USDC premium.",
  },
  {
    number: "03",
    title: "Settle & claim",
    copy: "At expiry, the keeper settles the outcome. Claim your underlying principal (OTM) or USDC proceeds (ITM) plus premium.",
  },
];

function HarvestMark() {
  return (
    <svg aria-hidden="true" className={styles.brandMark} viewBox="0 0 32 32" fill="none">
      <path d="M16 2.5C9.7 5.2 6 10.3 6 16.1c0 3.1 1.2 5.9 3.3 8.1V13.8c0-2.4.9-4.7 2.6-6.6" />
      <path d="M16 2.5c6.3 2.7 10 7.8 10 13.6 0 3.1-1.2 5.9-3.3 8.1V13.8c0-2.4-.9-4.7-2.6-6.6" />
      <path d="M12.3 29.5h7.4" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg aria-hidden="true" className={styles.arrow} viewBox="0 0 18 18" fill="none">
      <path d="M3 15 15 3M6 3h9v9" />
    </svg>
  );
}

function Check() {
  return (
    <svg aria-hidden="true" className={styles.check} viewBox="0 0 18 18" fill="none">
      <path d="m4 9 3.2 3.2L14 5.5" />
    </svg>
  );
}

function ProblemVisual({ type }: { type: "position" | "market" | "settlement" }) {
  if (type === "position") {
    return (
      <div className={styles.positionVisual}>
        <div className={styles.positionVisualTop}>
          <span>xStock position</span>
          <span className={styles.visualMuted}>held</span>
        </div>
        <div className={styles.positionValue}>$12,480.00</div>
        <div className={styles.positionFields}>
          <span>Balance <b>held</b></span>
          <span>Strategy <b className={styles.visualUnresolved}>undefined</b></span>
          <span>Cycle <b className={styles.visualUnresolved}>none</b></span>
        </div>
      </div>
    );
  }
  if (type === "market") {
    return (
      <div className={styles.marketVisual}>
        <div className={styles.marketChart}>
          <span className={styles.chartLabel}>Market price</span>
          <svg viewBox="0 0 420 190" preserveAspectRatio="none" aria-hidden="true">
            <path className={styles.marketGridLine} d="M0 145H420M0 95H420M0 45H420" />
            <path className={styles.marketPath} d="M0 138 C45 138 50 56 92 73 S145 145 182 107 S230 30 270 66 S330 126 420 18" />
          </svg>
        </div>
        <div className={styles.positionTrack}>
          <span>Your position</span>
          <div><i /></div>
          <b>held, but undefined</b>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.settlementVisual}>
      <div className={styles.settlementCondition}>
        <span>Settlement price</span>
        <b>→ outcome?</b>
      </div>
      <div className={styles.settlementFork}>
        <div><span>below strike</span><b>underlying?</b></div>
        <div><span>above strike</span><b>USDC?</b></div>
      </div>
      <div className={styles.settlementClaim}>
        <span>claim path</span>
        <b>not yet defined</b>
      </div>
    </div>
  );
}

export default function Home() {
  const pyth = usePythPrices();
  const [selectedVault, setSelectedVault] = useState<VaultItem | null>(null);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState<boolean>(false);
  const [isFaucetOpen, setIsFaucetOpen] = useState<boolean>(false);
  const [isKeeperLedgerOpen, setIsKeeperLedgerOpen] = useState<boolean>(false);

  const activeVaults: VaultItem[] = [
    {
      symbol: "xNVDA",
      name: "NVIDIA Corporation",
      color: "#76b900",
      price: pyth.xNVDA.price,
      premium: "8.4%",
      strike: `$${(pyth.xNVDA.numericPrice * 1.05).toFixed(2)}`,
      cycle: 2,
      status: "Devnet Active",
      mint: "EM5uTvQNpeTt4P1vRyfRdvtku42MytZjRsPG7KG4BRqV",
    },
    {
      symbol: "xAAPL",
      name: "Apple Inc.",
      color: "#9ca3af",
      price: pyth.xAAPL.price,
      premium: "6.8%",
      strike: `$${(pyth.xAAPL.numericPrice * 1.03).toFixed(2)}`,
      cycle: 1,
      status: "Open",
      mint: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
    },
    {
      symbol: "xTSLA",
      name: "Tesla Inc.",
      color: "#e82127",
      price: pyth.xTSLA.price,
      premium: "10.2%",
      strike: `$${(pyth.xTSLA.numericPrice * 1.05).toFixed(2)}`,
      cycle: 1,
      status: "Open",
      mint: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
    },
  ];

  return (
    <div className={styles.site} id="top">
      <MotionController />

      <div className={styles.backgroundLayer} aria-hidden="true">
        <Image
          className={`${styles.background} motion-background`}
          src="/harvest-pinterest-background.png"
          alt=""
          fill
          priority
          sizes="100vw"
        />
        <div className={styles.scrim} />
      </div>

      {/* Hero Section */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <header className={styles.header}>
          <a className={styles.brand} href="#top" aria-label="Harvest home">
            <HarvestMark />
            <span>Harvest</span>
          </a>

          <nav className={styles.navigation} aria-label="Primary navigation">
            {navigation.map((item) => (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className={styles.headerActions} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setIsFaucetOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                height: "38px",
                padding: "0 14px",
                borderRadius: "999px",
                border: "1px solid rgba(216, 168, 78, 0.45)",
                backgroundColor: "rgba(216, 168, 78, 0.12)",
                color: "var(--accent-gold)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                transition: "all 0.2s ease",
              }}
              title="Mint test xStocks and Devnet SOL"
            >
              Faucet ↗
            </button>

            <button
              type="button"
              onClick={() => setIsPortfolioOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                height: "38px",
                padding: "0 15px",
                borderRadius: "999px",
                border: "1px solid rgba(255, 255, 255, 0.22)",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Portfolio
            </button>

            <ConnectWalletButton
              style={{
                height: "38px",
                padding: "0 18px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: "var(--cream)",
                color: "var(--ink)",
                border: "none",
              }}
            />

            <MobileMenu
              className={styles.mobileMenu}
              items={navigation}
              onOpenFaucet={() => setIsFaucetOpen(true)}
              onOpenPortfolio={() => setIsPortfolioOpen(true)}
            />
          </div>
        </header>

        <div className={styles.heroContent}>
          <p className={styles.eyebrow} data-reveal="load">
            xStocks on Solana <span /> Weekly USDC yield <span /> Non-custodial
          </p>
          <h1 id="hero-title" data-reveal="load-stagger">
            <span>Hold</span> <span>your</span> <span>xStocks.</span>
            <br />
            <span>Earn</span> <span>weekly</span> <span>yield.</span>
          </h1>
          <p className={styles.heroCopy} data-reveal="load-body">
            Every Friday, Harvest pays you USDC premium for holding xNVDA, xAAPL, or xTSLA —
            without selling a single share.
          </p>
          <div className={styles.heroActions} data-reveal="load-buttons">
            <a className={styles.primaryCta} href="#markets">
              Explore vaults
            </a>
            <a className={styles.secondaryCta} href="#protocol">
              Read the protocol
            </a>
          </div>
          <p className={styles.disclaimer} data-reveal="load">
            Covered calls can limit upside. Yield is not guaranteed.
          </p>
        </div>
      </section>

      <main>
        {/* Narrative / Problem Section */}
        <section
          className={`${styles.signal} ${styles.problem}`}
          aria-labelledby="signal-title"
          data-reveal="section"
        >
          <div className={styles.problemHeader} data-reveal="copy">
            <div className={styles.signalIntro} data-reveal="fade">
              <span className={styles.signalDot} /> The gap in passive equity ownership
            </div>
            <p className={styles.eyebrow}>The problem</p>
            <h1 id="signal-title" className={styles.problemTitle}>
              A tokenized equity position
              <br />
              <em>is not a plan.</em>
            </h1>
          </div>

          <div className={styles.problemNarrative}>
            <aside className={styles.problemStage} aria-label="Visual explanation of the problem">
              <div className={styles.stageProgress} aria-label="Problem chapters">
                <span data-problem-progress="1">01</span>
                <span data-problem-progress="2">02</span>
                <span data-problem-progress="3">03</span>
              </div>
              <p className={styles.stageLabel}>The problem, unpacked</p>
              <p className={styles.stageCaption} data-stage-caption>
                01 · Ownership
              </p>
              <div className={styles.stageVisuals}>
                <div className={styles.problemVisual} data-problem-visual="1">
                  <ProblemVisual type="position" />
                </div>
                <div className={styles.problemVisual} data-problem-visual="2">
                  <ProblemVisual type="market" />
                </div>
                <div className={styles.problemVisual} data-problem-visual="3">
                  <ProblemVisual type="settlement" />
                </div>
              </div>
            </aside>

            <div className={styles.problemChapters}>
              <article className={styles.problemChapter} data-problem-chapter="1" data-reveal="copy">
                <div className={styles.chapterMeta}>
                  <span>01</span>
                  <span>03</span>
                </div>
                <h2 className={styles.problemHeading}>
                  Ownership is not
                  <br />
                  <em>a strategy.</em>
                </h2>
                <p className={styles.problemCopy}>
                  Tokenized equities make an asset portable and easy to hold on-chain. But a balance by
                  itself does not define what to do with the position, how to generate value, or what
                  happens when the market moves.
                </p>
                <div className={styles.mobileVisual}>
                  <ProblemVisual type="position" />
                </div>
              </article>

              <article className={styles.problemChapter} data-problem-chapter="2" data-reveal="copy">
                <div className={styles.chapterMeta}>
                  <span>02</span>
                  <span>03</span>
                </div>
                <h2 className={styles.problemHeading}>
                  The market moves.
                  <br />
                  <em>Your position doesn’t.</em>
                </h2>
                <p className={styles.problemCopy}>
                  An exposed equity position can track the market, but it can remain undefined while the
                  market changes. Price movement alone is not a productive plan.
                </p>
                <div className={styles.mobileVisual}>
                  <ProblemVisual type="market" />
                </div>
              </article>

              <article className={styles.problemChapter} data-problem-chapter="3" data-reveal="copy">
                <div className={styles.chapterMeta}>
                  <span>03</span>
                  <span>03</span>
                </div>
                <h2 className={styles.problemHeading}>
                  On-chain ownership
                  <br />
                  <em>still needs an outcome.</em>
                </h2>
                <p className={styles.problemCopy}>
                  Blockchain settlement makes the position verifiable. It does not automatically explain
                  which outcome applies, when it applies, or how the holder should claim it.
                </p>
                <div className={styles.mobileVisual}>
                  <ProblemVisual type="settlement" />
                </div>
                <a className={styles.textLink} href="#protocol">
                  See the solution <Arrow />
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* The Opportunity Section */}
        <section className={`${styles.section} ${styles.intro}`} id="protocol" data-reveal="section">
          <div data-reveal="copy">
            <p className={styles.eyebrow}>The opportunity</p>
            <h2 className={styles.sectionHeading}>
              Equity exposure.
              <br />
              <em>With a pulse.</em>
            </h2>
          </div>
          <div className={styles.introCopy} data-reveal="body">
            <p>
              Tokenized stocks keep the familiarity of equity with the settlement properties of a
              blockchain. Harvest adds a productive layer: an automated covered-call cycle that turns idle
              holdings into recurring USDC premium payouts.
            </p>
            <a className={styles.textLink} href="#how-it-works">
              See how the cycle works <Arrow />
            </a>
          </div>
        </section>

        {/* The Cycle Steps Section */}
        <section className={`${styles.section} ${styles.darkSection}`} id="how-it-works" data-reveal="section">
          <div className={styles.sectionTopline} data-reveal="fade">
            <p className={styles.eyebrow}>The cycle</p>
            <p className={styles.sectionIndex}>
              01 <span /> 03
            </p>
          </div>
          <div className={styles.steps}>
            {steps.map((step) => (
              <article
                className={styles.step}
                key={step.number}
                data-reveal="card"
                style={{ "--reveal-delay": `${Number(step.number) * 70}ms` } as CSSProperties}
              >
                <span className={styles.stepNumber}>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Settlement & Interactive Payoff Simulation */}
        <section className={`${styles.section} ${styles.settlement}`} data-reveal="section">
          <div className={styles.sectionTopline} data-reveal="copy">
            <p className={styles.eyebrow}>At expiry</p>
            <h2 className={styles.sectionHeading}>
              Two paths.
              <br />
              <em>One clear outcome.</em>
            </h2>
          </div>

          <div className={styles.outcomeGrid}>
            <article className={styles.outcome} data-reveal="card" style={{ "--reveal-delay": "0ms" } as CSSProperties}>
              <span className={styles.outcomeTag}>OTM settlement</span>
              <h3>Keep the underlying.</h3>
              <p>
                When the settlement price stays below the strike at Friday expiry, claim your xStock
                principal and the USDC premium.
              </p>
              <div className={styles.outcomeValue}>
                <strong>100%</strong>
                <span>underlying returned</span>
              </div>
            </article>

            <article
              className={`${styles.outcome} ${styles.outcomeAccent}`}
              data-reveal="card"
              style={{ "--reveal-delay": "100ms" } as CSSProperties}
            >
              <span className={styles.outcomeTag}>ITM settlement</span>
              <h3>Receive USDC proceeds.</h3>
              <p>
                When the price exceeds the strike, the keeper converts the underlying through Jupiter and
                distributes the strike-price USDC proceeds plus premium.
              </p>
              <div className={styles.outcomeValue}>
                <strong>USDC</strong>
                <span>principal equivalent + premium</span>
              </div>
            </article>
          </div>

          {/* Interactive Payoff Visualizer Slider */}
          <div style={{ marginTop: "40px" }} data-reveal="card">
            <PayoffVisualizer />
          </div>
        </section>

        {/* Active Markets & Vaults Section */}
        <section className={`${styles.section} ${styles.markets}`} id="markets" data-reveal="section">
          <div className={styles.sectionTopline} data-reveal="fade">
            <p className={styles.eyebrow}>Devnet Vaults</p>
            <p className={styles.sectionIndex}>
              02 <span /> 03
            </p>
          </div>
          <div className={styles.marketsHeader}>
            <h2 className={styles.sectionHeading}>
              Start with
              <br />
              <em>what you own.</em>
            </h2>
            <p>
              Deposit tokenized equities to lock weekly covered-call yields. Each market is verified
              against the deployed Anchor program on Solana Devnet.
            </p>
          </div>

          <div className={styles.marketGrid}>
            {activeVaults.map((vault, index) => (
              <article
                className={styles.marketCard}
                key={vault.symbol}
                data-reveal="card"
                style={{
                  "--reveal-delay": `${index * 90}ms`,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                } as CSSProperties}
                onClick={() => setSelectedVault(vault)}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className={styles.marketTicker}>{vault.symbol}</div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontFamily: "var(--font-mono)",
                        color: vault.status === "Devnet Active" ? "var(--lime)" : "var(--cream)",
                        opacity: 0.8,
                      }}
                    >
                      ● {vault.status}
                    </span>
                  </div>

                  <h3>{vault.name}</h3>

                  <div className={styles.marketMeta}>
                    <span>Pyth Spot: <strong>{vault.price}</strong></span>
                    <span>OTM Strike: <strong>{vault.strike}</strong></span>
                  </div>

                  <div style={{ margin: "14px 0", padding: "10px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "11px", opacity: 0.7 }}>Weekly USDC Premium</div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--lime)", fontFamily: "var(--font-mono)" }}>
                      +{vault.premium}
                    </div>
                  </div>

                  <div className={styles.marketMint}>
                    Mint <code>{vault.mint.slice(0, 6)}...{vault.mint.slice(-4)}</code>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVault(vault);
                  }}
                  style={{
                    marginTop: "20px",
                    width: "100%",
                    height: "44px",
                    borderRadius: "999px",
                    backgroundColor: "var(--cream)",
                    color: "var(--ink)",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  Deposit &amp; Harvest Yield <Arrow />
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* Autonomous Crank & Verified On-Chain Ledger */}
        <section className={styles.section} id="crank" data-reveal="section" style={{ paddingTop: "20px", paddingBottom: "20px" }}>
          <div
            style={{
              padding: "16px 24px",
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--lime)", boxShadow: "0 0 10px var(--lime)" }} />
              <div style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)" }}>
                <strong>Autonomous Keeper Crank:</strong> Polling every 10s · Cycle #2 locked · Next Settle Friday 16:00 EST
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsKeeperLedgerOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "999px",
                backgroundColor: "rgba(216, 168, 78, 0.12)",
                border: "1px solid rgba(216, 168, 78, 0.35)",
                color: "var(--accent-gold)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                transition: "all 0.2s ease",
              }}
            >
              View Verified Ledger &amp; Tx ↗
            </button>
          </div>
        </section>

        {/* About & Trust Section */}
        <section className={`${styles.section} ${styles.about}`} id="about" data-reveal="section">
          <div className={styles.aboutCopy} data-reveal="copy">
            <p className={styles.eyebrow}>Built in public</p>
            <h2 className={styles.sectionHeading}>
              Non-custodial
              <br />
              <em>by design.</em>
            </h2>
          </div>
          <div className={styles.aboutDetails} data-reveal="body">
            <p>
              Harvest is an automated covered-call vault for on-chain equity. Pyth Hermes prices the cycle,
              an autonomous keeper keeps it moving, and your position stays visible on-chain from deposit to
              claim.
            </p>
            <ul>
              <li><Check /> Token-2022 compatible vaults</li>
              <li><Check /> Pyth Hermes real-time price feeds</li>
              <li><Check /> Automated lifecycle keeper daemon</li>
              <li><Check /> Deterministic strike &amp; premium pricing</li>
            </ul>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <a
                className={styles.darkCta}
                href="https://github.com/Olalolo22/harvest"
                target="_blank"
                rel="noreferrer"
              >
                Read the docs
              </a>
              <button
                type="button"
                onClick={() => setIsFaucetOpen(true)}
                style={{
                  height: "48px",
                  padding: "0 22px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Testnet Faucet ↗
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer} data-reveal="footer">
        <a className={styles.brand} href="#top">
          <HarvestMark />
          <span>Harvest</span>
        </a>
        <p>Hold your xStocks. Earn weekly USDC yield. Never sell.</p>
        <div className={styles.footerLinks}>
          <a href="https://github.com/Olalolo22/harvest" target="_blank" rel="noreferrer">
            GitHub <Arrow />
          </a>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>

      {/* Interactive Modals */}
      {selectedVault && (
        <VaultModal
          vault={selectedVault}
          onClose={() => setSelectedVault(null)}
          onOpenFaucet={() => setIsFaucetOpen(true)}
        />
      )}

      <PortfolioDrawer
        isOpen={isPortfolioOpen}
        onClose={() => setIsPortfolioOpen(false)}
        onOpenDeposit={(sym) => {
          const v = activeVaults.find((item) => item.symbol === sym) || activeVaults[0];
          setSelectedVault(v);
        }}
        onOpenFaucet={() => setIsFaucetOpen(true)}
      />

      <FaucetModal
        isOpen={isFaucetOpen}
        onClose={() => setIsFaucetOpen(false)}
      />

      <KeeperLedgerModal
        isOpen={isKeeperLedgerOpen}
        onClose={() => setIsKeeperLedgerOpen(false)}
      />
    </div>
  );
}
