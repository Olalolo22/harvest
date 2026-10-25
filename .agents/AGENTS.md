
## General Workflow & Style Rules
- **Resource Constraints (Codespaces):** The user develops in cloud environments (like GitHub Codespaces) with limited RAM. Do NOT automatically attempt to run extremely heavy tasks locally (e.g., zero-knowledge prover generation, massive Rust builds, or heavy Docker containers) without verifying it's safe to do so. Suggest delegating heavy workloads when appropriate.
- **Pragmatic Deadlines:** When under strict time constraints (e.g., hackathons), prioritize user-facing deliverables (frontend mocks, UI polish, pitch scripts) over deep, time-consuming backend debugging. If a complex technical issue blocks progress near a deadline, immediately propose a "Mock Mode" or presentation workaround, **but always explicitly inform the user of what is being compromised and the tradeoffs involved so they can make an informed decision.**
- **Presentation Focus:** The user prioritizes high-impact presentation. Always ensure that `README.md` files are highly polished, architecture documents are clear, and UI elements feel premium and modern to "sell the vision".
- **Formatting for the user:** The user's chat UI does NOT render LaTeX ($...$ shows as raw code). Write formulas in plain text/code blocks (e.g. `F = S * (1 + r_d) / (1 + r_f)`) and define every symbol in words. Never link non-code things to unrelated files.
- **Learning style:** User wants to be TAUGHT from first principles (intuition -> mechanics -> plain-text math -> DeFi analogue -> code). Treat as capable, not a beginner. Don't state assumptions (e.g. university name) as facts.

## Builder Profile & Identity (Persistent Context)
- **Identity:** Olumide Lala (Olu) — `@pray_4motivatio` (Twitter) / `@Olalolo22` (GitHub).
- **Academic & Stage:** Final year (Year 4) Finance undergraduate in Nigeria, graduating at 21. High-velocity builder balancing university, early career decisions, and deep protocol engineering.
- **Instinct:** Gravitates toward privacy, ZK, settlement infrastructure, execution environments, protocol primitives, and agent infrastructure. Rarely builds "apps" — almost always asks "what's the underlying primitive?"
- **Strength:** Deep technical ambition, strong mechanism design, rigorous research habits, high engineering standards. Proven ability to design and ship non-trivial primitives across Solana (Anchor, Token-2022, Pyth), Sui Move, and EVM/Solidity.
- **Compression gap:** Demo/narrative compression is the weakest bar relative to the others. Technical instincts are elite; packaging instincts are underdeveloped relative to them.
- **Overcompensation pattern:** Under time pressure or financial stress, tends to go *harder and deeper* rather than *simpler and tighter*. Act as a counterweight — push back and ask "what's the 20-second version?" before scope grows during hacks.
- **Imposter syndrome trigger:** Feels like a fraud when building impressive infra, especially when considering sharing or promoting it publicly. Will say things like "who do I think I am" or "someone has definitely done more." Push back on this directly — the standard isn't "did someone do more," it's "did *you* do something real?" If yes, say so clearly and firmly.
- **Validation need:** Wants experienced ecosystem people to genuinely recognize at least one build as real, serious work. This is a legitimate need, not insecurity. Hackathon judges are a poor proxy for this — ecosystem leads, protocol founders, and grant reviewers are the right audience for deep infra work. When relevant, redirect toward those channels rather than hackathon judges.
- **Mindset:** "Do the best I can." Researches past winners, curates lessons from prior submissions, studies judge criteria, then pushes technical execution to the max. Does not sandbag. Needs a counterweight that enforces format fit and compression, not just technical depth.
- **Financial context:** In a crucial life stage — needs income. Has active client/project work (WDC Construct and similar). Hackathons are supplemental, not primary income strategy. Never let a hack spiral into weeks of sunk effort on a low-probability prize.

## Career, Academic & Life Crossroads
- **Post-Graduation Pathways (Graduating at 21):**
  - **Financial Engineering Master's (MFE / Quant Finance):** Strong fit for translating finance degree + smart contract/vault systems into institutional credibility and overseas access. Main hesitation is the advanced quantitative bar (stochastic calculus, continuous-time finance, optimization). Calibration plan: Use Year 4 quantitative coursework + self-study simulations to test appetite and math comfort before committing to heavy tuition abroad.
  - **CFA vs. Master's:** CFA is lower cost and flexible alongside work, but less technical/quantitative for pure protocol/quant roles. Keep options open until Year 4 performance and work data are in.
  - **Traditional Finance & Campus Opportunities:** Targeting school's TIS organization (AIG front-office exposure) to experience markets/trading beyond standard IB.
  - **Internship Strategy (Urgent Bridge):** Currently lacks formal internship credentials due to late applications. Even if commercial bank roles (accounting/clearing/reconciliation) feel uninspiring compared to building on-chain primitives, treat them pragmatically as an institutional filter-breaker and professional bridge. Do not reject corporate finance seats out of pride; leverage them as credibility while continuing to ship primitives in parallel.

## Verified Portfolio & Multi-Chain Systems Range
- **Not a single-chain builder:** Demonstrated cross-ecosystem primitive engineering:
  - **Solana (`Harvest`):** Covered-call yield vaults for tokenized US equities (xStocks: AAPLx, NVDAx) using Token-2022, Pyth oracles, Jupiter swaps, and keeper bots.
  - **Solana (`Aegis Ledger`):** Shielded UTXO private payroll/treasury engine for DAOs with client-side ZK proofs and viewing keys.
  - **Sui (`Persist`):** Temporal access control and continuity primitive using encrypted capsules with Seal + Walrus on Sui Move.
  - **EVM / Arc (`Ragent`):** Zero-custody agent-to-agent hiring and settlement layer with Circle programmable wallets and Solidity settlement logs.
  - **OSS & Infra:** Contributions to `RouteDock` (cross-chain x402 payment execution) and related payment/vault systems.
- **High-Assurance Mindset (`portfolio-research`):** Maintains an explicit verified engineering dossier (36 repos, 21 dossiers, E1/E2 evidence tiers) auditing his own claims, code, and benchmarks. Treats his own career with the same verification rigor as his systems.

## The North Star: Token Engineering & Mechanism Innovation
- **The Core Ambition:** Transition from building hackathon vault products to becoming a recognized inventor and engineer of novel on-chain financial primitives (comparable to Pair Tokens, intent clearing markets, Uniswap v4 hook architectures, novel liquidity representations).
- **Peer Benchmark:** `@winsznx` (Tim) — models high shipping velocity, multi-chain protocol infrastructure (payments, clearing, solvers, x402), and turning novel coordination mechanisms into battle-tested systems.
- **The Discipline (Token Engineering / Cryptoeconomics):**
  - Combines AMM/CFMM theory (LVR, pool invariants), mechanism design, and systems engineering.
  - Expanding from Solana/Rust into production EVM/Solidity and Uniswap v4 hook architectures (PoolManager singleton, custom accounting, callback interfaces).
  - Loop: Identify an economic friction/awkwardness → design mechanism & model invariants → implement working system (contracts + keepers) → document trade-offs and failure modes.
- **Portfolio over Credentials:** In Web3 and protocol engineering, verifiable shipped systems and public technical reasoning always outweigh CV bullet points. Focus on accumulating working proof.

## Hackathon & Demo Strategy (Ingrained Lessons)

Apply these EVERY time we brainstorm a hack, design a demo, write a pitch, or review a submission strategy. These are derived from Rescue/MagicBlock Blitz postmortem and are permanent.

### The Core Diagnosis
- Technical ambition and mechanism design are elite. Selection + packaging + demo instincts are the lagging variable.
- The failure mode is: "bringing an architecture and asking judges to discover the product." The fix is: "bring a product whose existence makes the architecture feel inevitable."

### The 20-Second Rule (MANDATORY CHECK)
Before any hack build goes deep, ask: **"Can a stranger feel why this matters in 20 seconds without any prerequisite knowledge?"**
If no → find the smallest human-readable *surface* of the protocol and make THAT the product judges experience first. The depth can remain; the entry point must be instant.

### Format Calibration
- **Week-long blitzes (e.g. MagicBlock Blitz):** Cognitive load is the silent killer. Judges review 40–80 projects in one session with fried brains. Anything requiring prerequisite context (liquidation mechanics, health factors, ZK structure, auction theory) loses before it starts. Build something visceral, self-evident, and immediately interactive.
- **Longer grant/ecosystem programs:** Depth is rewarded. Architecture docs, probe reports, and empirical benchmarks belong here.
- **Match the energy of the format.** Week-long blitz ≠ venue for Rescue-level infra depth — not because the work isn't good, but because the format doesn't give judges bandwidth to evaluate it.

### The Iceberg Model
The 90% architecture, TEE, ZK, proofs, and mechanism design stays. It's what makes the work real. But the top 10% — the hook — must exist and must land in under 20 seconds. A judge should feel the payoff before reading a single doc.

### Product Compression (Key Skill to Develop)
"Product compression" = can I take a complicated protocol and make a stranger understand why they should give a shit in 20 seconds? This is different from "making the website prettier." It's a first-class engineering skill. Build it deliberately. Every hack should have an explicit "compression pass" before submission.

### Conforming vs. Compressing
Packaging for judges is NOT "conforming" or "dumbing down." It's bandwidth compression — a different interface to the same idea. Anatoly didn't explain Tower BFT to VCs; he said "NASDAQ on a blockchain with a clock." The machinery didn't change. The entry point did.

### The Three Buckets (Keep Deliberately Separate)
1. **Cash game:** WDC Construct, freelance, bounties. Optimize for probability × speed × effort. No ego. If someone pays for a boring dashboard, build the dashboard.
2. **Hackathon game:** Only enter when there's tight format fit OR when already building something that maps cleanly. When entering: legibility, demoability, obvious user, narrow scope, polished product, 3–5 minute story. Change the *selection function* — ask "what painful user problem lets me expose this protocol in the simplest possible product?" not "what interesting protocol can I build with this tech?"
3. **Protocol/company game:** Measure by ecosystem attention, integration interest, grant traction, real user demand — NOT hackathon results. Rescue/Aegis/etc. belong here.

### Ecosystem Validation vs. Hackathon Validation
Deep infra work (probe reports, TEE benchmarks, architectural discoveries) should be directed to protocol core teams, Solana Foundation ecosystem leads, and founders — NOT hackathon judges. A tweet thread tagging the right people costs 45 minutes and has asymmetric upside. Hackathon judging panels are rarely the engineers who can actually evaluate this work.

### What Winning/Losing Means
- Winning a hackathon ≠ the work is validated.
- Losing a hackathon ≠ the work is bad.
- A hackathon result is a noisy, context-constrained, bandwidth-limited measurement. Don't romanticize infra because judges didn't reward it — but don't doubt it either. The real test: "Is anyone in the ecosystem asking 'can we integrate this?'"

### Case Study: MagicBlock Blitz 8 & The "Sister Project" Trap
- **The Core Hackathon Intent:** In Blitz hackathons, MagicBlock wants to show the world that Solana can do **sub-50ms real-time multiplayer loops that look and feel like Web2 games**, with custody settling back on L1.
- **The Podium Reality:**
  - 1st: *Herd* (30s party game using **Private Ephemeral Rollup** — exact same primitive as Rescue)
  - 2nd: *Ultra Pong* (8-player pong at 20 ticks/sec in Ephemeral Rollup)
  - 3rd: *Alerith* (Sub-50ms duel arena in Ephemeral Rollup)
  - Wizardio's Choice: *HoldOut* (Hold vs fold game — virtually identical mechanic to *RugRoll*)
- **The "Sister Project" Trap (DO NOT REPEAT):**
  When building two projects for a sprint (e.g., one deep B2B protocol like *Rescue* and one visceral game like *RugRoll*):
  - **Never abandon or procrastinate on the visceral game** under the assumption that it's "too toy-like" or "not serious enough."
  - In week-long blitzes, the visceral 10-second real-time loop is what the judges want to see.
  - If a working real-time interactive game exists, polish it, record the 30-second punchy demo, and ship it.

### Case Study: MagicBlock Blitz 9 & The "Native Turf" Trap (`Last Pavilion` vs. `NoirWire`)
- **The Core Hackathon Intent:** In Blitz 9, MagicBlock heavily showcased **Private Ephemeral Rollups (PER)** and zero-latency execution.
- **The Podium Reality:**
  - 1st: *Battle Cities* (`magic.battlecities.com` — Unity WebGL NES tank arcade remake; immediate zero-explanation reflex loop)
  - 2nd: *Blackout* (`blackout.anshverma.tech` — Fog-of-war battle royale; *"nobody sees you, not even the chain"* using PER)
  - 3rd: *NoirWire* (`noirwire.com` — **NOT A GAME**: private dark pool order book for tokenized US stocks / xStocks on PER)
  - Wizardio's Choice: *Nightfall* (`nightfall-blitz.vercel.app` — Fog-of-war battle royale on PER)
- **The "Native Turf" Trap (DO NOT REPEAT):**
  - Never force yourself to build an abstract toy game (like an 8-nation countdown clock) under the false assumption that a hackathon "only rewards games."
  - The 3rd place winner (*NoirWire*) built the exact financial primitive that maps directly to your proven strengths (*Harvest* tokenized equities + *Aegis* shielded private execution).
  - Apply the **Blackout / HoldOut Compression Bar**: 1-sentence hook, 1 native infrastructure capability, zero prerequisite lore.

### Case Study: StockLana & The "Two-Click / Zero-Condition Payoff" Trap (`Harvest` vs. `Draw` & `Roster`)
- **The Core Hackathon Intent:** StockLana (604 project submissions, $126k pool) focused on tokenized equities (xStocks, PreStocks) to prove Solana can beat traditional brokerages.
- **The Podium Reality:**
  - 1st: *Roster Finance* ($35,000 — **The Exact Same Primitive as Harvest**: fully collateralized options on tokenized stocks, but packaged as *"Stock leverage without margin liquidation"* and supporting **PreStocks pre-IPO tokens**).
  - 2nd: *Draw* ($20,000 — Vanilla "borrow against holdings" concept, packaged as a 1-click Privy/Kamino checkout button: *"Spend against your stock at checkout without selling"*).
  - 3rd: *CRESCO* ($15,000 — Family/agent mandate boundaries with single-use exception nonces: *"Act alone inside the rules. Ask once for the exception"*).
- **The Core Diagnosis & Failure Mode:**
  - The macro thesis was 100% right: **options on tokenized equities took 1st place overall**.
  - Code problems (keeper trust, admin reserve) were easily solvable in Rust, but the fatal flaw was **Cognitive Model Friction / The "If-Else" Payoff Trap**:
    - *"If price < strike, you keep stock + USDC. Else if price >= strike, your stock is sold and you get all USDC."*
    - If a user or frontend co-builder (Jay) cannot explain the outcome in 2 clicks without an "If/Else" conditional flowchart, the product creates split-brain cognitive friction before anyone deposits.
- **The Permanent Rules (DO NOT REPEAT):**
  1. **The "No Conditional If/Else" Payoff Rule (Eliminate Assignment Shock):**
     - *The Split-Brain Problem:* Piecewise payoffs (`Payoff = S_T + P` if `S_T < K` else `K + P`) make sense to quantitative engineers, but force users into a mental flowchart where asset denominations change (stock vs USDC). This creates *assignment shock*—users feel they lost their stock on a rally instead of realizing an options win.
     - *The TradFi / CEX Analogue:* Desks like Goldman and Binance never pitch "short covered calls." They pitch a single intent: **"Sell High / Target Exit Note"** (*"Earn 18% APY while waiting to sell NVDA at $200"*). If price stays low, you kept stock + 18% APY while waiting; if price rallies, your limit exit triggered at $200 + 18% APY. Both paths fulfill the *same* winning intent.
     - *The Law:* Whenever a primitive has two settlement paths (ITM/OTM, exercised/expired), never present them as an If/Else fork. Re-frame the product around a single user goal where both paths count as winning with ZERO conditional branches.
  2. **The "Frontend Co-Builder Test" (The Jay Test):** Pitch the user flow to your frontend partner before writing a single line of Rust. If the frontend dev struggles to explain the payoff without tooltips or multi-step decision trees, the packaging is broken.
  3. **The Sponsor Integration Law:** In hackathons with named sponsor bounties (e.g. PreStocks), natively integrate the sponsor's asset into the core demo flow. Roster did this with PreStocks and secured judge buy-in; Harvest stuck purely to Backed Finance xStocks.
  4. **The Trojan Horse Wedge (Progressive Disclosure):** Deep plumbing wins hackathons (Roster's options engine beat Draw for 1st place). But the engine must hide behind a single, obvious front door. Present **one dead-simple use case or core proposition** that anyone grasps in 5 seconds. Let judges and users step through that single door first—then let them look under the hood and discover that the underlying primitive can actually do 10x more. Never put the engine room on the front porch.
