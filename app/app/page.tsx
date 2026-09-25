import type { CSSProperties } from "react";
import Image from "next/image";
import { MobileMenu } from "./MobileMenu";
import { MotionController } from "./MotionController";
import styles from "./page.module.css";

const navigation = [
  { label: "Protocol", href: "#protocol" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Markets", href: "#markets" },
  { label: "About", href: "#about" },
];

const steps = [
  { number: "01", title: "Deposit", copy: "Deposit xStocks into a vault during its deposit window. Your position is recorded on-chain." },
  { number: "02", title: "Lock the cycle", copy: "A keeper captures the Pyth spot price, sets an out-of-the-money strike, and locks the premium." },
  { number: "03", title: "Settle & claim", copy: "At expiry, the keeper settles the outcome. Claim your underlying or USDC proceeds plus the premium." },
];

const markets = [
  { ticker: "AAPLx", name: "Apple", mint: "XsbEhL…JzJp" },
  { ticker: "NVDAx", name: "NVIDIA", mint: "Xsc9q…q9Eh" },
  { ticker: "TSLAx", name: "Tesla", mint: "XsDoV…HzZo" },
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
  return <svg aria-hidden="true" className={styles.arrow} viewBox="0 0 18 18" fill="none"><path d="M3 15 15 3M6 3h9v9" /></svg>;
}

function Check() {
  return <svg aria-hidden="true" className={styles.check} viewBox="0 0 18 18" fill="none"><path d="m4 9 3.2 3.2L14 5.5" /></svg>;
}

function ProblemVisual({ type }: { type: "position" | "market" | "settlement" }) {
  if (type === "position") {
    return <div className={styles.positionVisual}><div className={styles.positionVisualTop}><span>xStock position</span><span className={styles.visualMuted}>held</span></div><div className={styles.positionValue}>$12,480.00</div><div className={styles.positionFields}><span>Balance <b>held</b></span><span>Strategy <b className={styles.visualUnresolved}>undefined</b></span><span>Cycle <b className={styles.visualUnresolved}>none</b></span></div></div>;
  }
  if (type === "market") {
    return <div className={styles.marketVisual}><div className={styles.marketChart}><span className={styles.chartLabel}>Market price</span><svg viewBox="0 0 420 190" preserveAspectRatio="none" aria-hidden="true"><path className={styles.marketGridLine} d="M0 145H420M0 95H420M0 45H420" /><path className={styles.marketPath} d="M0 138 C45 138 50 56 92 73 S145 145 182 107 S230 30 270 66 S330 126 420 18" /></svg></div><div className={styles.positionTrack}><span>Your position</span><div><i /></div><b>held, but undefined</b></div></div>;
  }
  return <div className={styles.settlementVisual}><div className={styles.settlementCondition}><span>Settlement price</span><b>→ outcome?</b></div><div className={styles.settlementFork}><div><span>below strike</span><b>underlying?</b></div><div><span>above strike</span><b>USDC?</b></div></div><div className={styles.settlementClaim}><span>claim path</span><b>not yet defined</b></div></div>;
}

export default function Home() {
  return (
    <div className={styles.site} id="top">
      <MotionController />
      <div className={styles.backgroundLayer} aria-hidden="true">
        <Image className={`${styles.background} motion-background`} src="/harvest-pinterest-background.png" alt="" fill priority sizes="100vw" />
        <div className={styles.scrim} />
      </div>
      <section className={styles.hero} aria-labelledby="hero-title">
        <header className={styles.header}>
          <a className={styles.brand} href="#top" aria-label="Harvest home"><HarvestMark /><span>Harvest</span></a>
          <nav className={styles.navigation} aria-label="Primary navigation">
            {navigation.map((item) => <a key={item.label} href={item.href}>{item.label}</a>)}
          </nav>
          <div className={styles.headerActions}>
            <a className={styles.headerCta} href="#markets">Get started</a>
            <MobileMenu className={styles.mobileMenu} items={navigation} />
          </div>
        </header>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow} data-reveal="load">Solana <span /> Tokenized equities <span /> Covered calls</p>
          <h1 id="hero-title" data-reveal="load-stagger">
            <span>Put</span> <span>your</span> <span>assets</span><br />
            <span>to</span> <span>work</span>
          </h1>
          <p className={styles.heroCopy} data-reveal="load-body">Automated covered-call yield, built for tokenized equities on Solana.</p>
          <div className={styles.heroActions} data-reveal="load-buttons">
            <a className={styles.primaryCta} href="#how-it-works">Explore vaults</a>
            <a className={styles.secondaryCta} href="#protocol">Read the protocol</a>
          </div>
          <p className={styles.disclaimer} data-reveal="load">Covered calls can limit upside. Yield is not guaranteed.</p>
        </div>
      </section>
      <main>
        <section className={`${styles.signal} ${styles.problem}`} aria-labelledby="signal-title" data-reveal="section">
          <div className={styles.problemHeader} data-reveal="copy">
            <div className={styles.signalIntro} data-reveal="fade"><span className={styles.signalDot} /> The gap in passive equity ownership</div>
            <p className={styles.eyebrow}>The problem</p>
            <h1 id="signal-title" className={styles.problemTitle}>A tokenized equity position<br /><em>is not a plan.</em></h1>
          </div>
          <div className={styles.problemNarrative}>
            <aside className={styles.problemStage} aria-label="Visual explanation of the problem">
              <div className={styles.stageProgress} aria-label="Problem chapters">
                <span data-problem-progress="1">01</span><span data-problem-progress="2">02</span><span data-problem-progress="3">03</span>
              </div>
              <p className={styles.stageLabel}>The problem, unpacked</p>
              <p className={styles.stageCaption} data-stage-caption>01 · Ownership</p>
              <div className={styles.stageVisuals}>
                <div className={styles.problemVisual} data-problem-visual="1"><ProblemVisual type="position" /></div>
                <div className={styles.problemVisual} data-problem-visual="2"><ProblemVisual type="market" /></div>
                <div className={styles.problemVisual} data-problem-visual="3"><ProblemVisual type="settlement" /></div>
              </div>
            </aside>
            <div className={styles.problemChapters}>
              <article className={styles.problemChapter} data-problem-chapter="1" data-reveal="copy">
                <div className={styles.chapterMeta}><span>01</span><span>03</span></div>
                <h2 className={styles.problemHeading}>Ownership is not<br /><em>a strategy.</em></h2>
                <p className={styles.problemCopy}>Tokenized equities make an asset portable and easy to hold on-chain. But a balance by itself does not define what to do with the position, how to generate value, or what happens when the market moves.</p>
                <div className={styles.mobileVisual}><ProblemVisual type="position" /></div>
              </article>
              <article className={styles.problemChapter} data-problem-chapter="2" data-reveal="copy">
                <div className={styles.chapterMeta}><span>02</span><span>03</span></div>
                <h2 className={styles.problemHeading}>The market moves.<br /><em>Your position doesn’t.</em></h2>
                <p className={styles.problemCopy}>An exposed equity position can track the market, but it can remain undefined while the market changes. Price movement alone is not a productive plan.</p>
                <div className={styles.mobileVisual}><ProblemVisual type="market" /></div>
              </article>
              <article className={styles.problemChapter} data-problem-chapter="3" data-reveal="copy">
                <div className={styles.chapterMeta}><span>03</span><span>03</span></div>
                <h2 className={styles.problemHeading}>On-chain ownership<br /><em>still needs an outcome.</em></h2>
                <p className={styles.problemCopy}>Blockchain settlement makes the position verifiable. It does not automatically explain which outcome applies, when it applies, or how the holder should claim it.</p>
                <div className={styles.mobileVisual}><ProblemVisual type="settlement" /></div>
                <a className={styles.textLink} href="#protocol">See the solution <Arrow /></a>
              </article>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.intro}`} id="protocol" data-reveal="section">
          <div data-reveal="copy">
            <p className={styles.eyebrow}>The opportunity</p>
            <h2 className={styles.sectionHeading}>Equity exposure.<br /><em>With a pulse.</em></h2>
          </div>
          <div className={styles.introCopy} data-reveal="body">
            <p>Tokenized stocks keep the familiarity of equity with the settlement properties of a blockchain. Harvest adds a productive layer: a covered-call cycle that turns idle holdings into recurring premium opportunities.</p>
            <a className={styles.textLink} href="#how-it-works">See how the cycle works <Arrow /></a>
          </div>
        </section>

        <section className={`${styles.section} ${styles.darkSection}`} id="how-it-works" data-reveal="section">
          <div className={styles.sectionTopline} data-reveal="fade">
            <p className={styles.eyebrow}>The cycle</p>
            <p className={styles.sectionIndex}>01 <span /> 03</p>
          </div>
          <div className={styles.steps}>
            {steps.map((step) => (
              <article className={styles.step} key={step.number} data-reveal="card" style={{ "--reveal-delay": `${Number(step.number) * 70}ms` } as CSSProperties}>
                <span className={styles.stepNumber}>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.settlement}`} data-reveal="section">
          <div className={styles.sectionTopline} data-reveal="copy">
            <p className={styles.eyebrow}>At expiry</p>
            <h2 className={styles.sectionHeading}>Two paths.<br /><em>One clear outcome.</em></h2>
          </div>
          <div className={styles.outcomeGrid}>
            <article className={styles.outcome} data-reveal="card" style={{ "--reveal-delay": "0ms" } as CSSProperties}>
              <span className={styles.outcomeTag}>OTM settlement</span>
              <h3>Keep the underlying.</h3>
              <p>When the settlement price stays below the strike, claim your xStock principal and the USDC premium.</p>
              <div className={styles.outcomeValue}><strong>100%</strong><span>underlying returned</span></div>
            </article>
            <article className={`${styles.outcome} ${styles.outcomeAccent}`} data-reveal="card" style={{ "--reveal-delay": "100ms" } as CSSProperties}>
              <span className={styles.outcomeTag}>ITM settlement</span>
              <h3>Receive USDC proceeds.</h3>
              <p>When the price exceeds the strike, the keeper converts the underlying through Jupiter and distributes the USDC proceeds plus premium.</p>
              <div className={styles.outcomeValue}><strong>USDC</strong><span>principal equivalent + premium</span></div>
            </article>
          </div>
        </section>
        <section className={`${styles.section} ${styles.markets}`} id="markets" data-reveal="section">
          <div className={styles.sectionTopline} data-reveal="fade">
            <p className={styles.eyebrow}>Markets</p>
            <p className={styles.sectionIndex}>02 <span /> 03</p>
          </div>
          <div className={styles.marketsHeader}>
            <h2 className={styles.sectionHeading}>Start with<br /><em>what you own.</em></h2>
            <p>Launch a vault around the tokenized equities you already want to hold. Each market is verified against the live mint configuration.</p>
          </div>
          <div className={styles.marketGrid}>
            {markets.map((market, index) => (
              <article className={styles.marketCard} key={market.ticker} data-reveal="card" style={{ "--reveal-delay": `${index * 90}ms` } as CSSProperties}>
                <div className={styles.marketTicker}>{market.ticker}</div>
                <h3>{market.name}</h3>
                <div className={styles.marketMeta}><span>Token-2022</span><span>8 decimals</span></div>
                <div className={styles.marketMint}>Mint <code>{market.mint}</code></div>
                <a href="#about" aria-label={`Learn more about ${market.ticker}`}>View market <Arrow /></a>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.about}`} id="about" data-reveal="section">
          <div className={styles.aboutCopy} data-reveal="copy">
            <p className={styles.eyebrow}>Built in public</p>
            <h2 className={styles.sectionHeading}>Non-custodial<br /><em>by design.</em></h2>
          </div>
          <div className={styles.aboutDetails} data-reveal="body">
            <p>Harvest is an automated covered-call vault for on-chain equity. Pyth prices the cycle, a keeper keeps it moving, and your position stays visible on-chain from deposit to claim.</p>
            <ul>
              <li><Check /> Token-2022 compatible vaults</li>
              <li><Check /> Pyth Hermes price feeds</li>
              <li><Check /> Automated lifecycle keeper</li>
            </ul>
            <a className={styles.darkCta} href="https://github.com/Olalolo22/harvest" target="_blank" rel="noreferrer">Read the docs</a>
          </div>
        </section>
      </main>

      <footer className={styles.footer} data-reveal="footer">
        <a className={styles.brand} href="#top"><HarvestMark /><span>Harvest</span></a>
        <p>Automated covered-call yield on Solana.</p>
        <div className={styles.footerLinks}>
          <a href="https://github.com/Olalolo22/harvest" target="_blank" rel="noreferrer">GitHub <Arrow /></a>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </div>
  );
}
