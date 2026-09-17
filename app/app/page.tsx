"use client";

import { useState } from "react";
import styles from "./design-v2.module.css";
import Navbar from "./components/Navbar";
import Hero, { VaultItem } from "./components/Hero";
import LiveHarvestStrip from "./components/LiveHarvestStrip";
import ConceptSection from "./components/ConceptSection";
import HarvestCycle from "./components/HarvestCycle";
import VaultGrid from "./components/VaultGrid";
import StrategySection from "./components/StrategySection";
import WhyHarvest from "./components/WhyHarvest";
import Infrastructure from "./components/Infrastructure";
import RiskSection from "./components/RiskSection";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";
import VaultModal from "./components/VaultModal";
import PortfolioDrawer from "./components/PortfolioDrawer";
import FaucetModal from "./components/FaucetModal";
import { usePythPrices } from "./hooks/usePythPrices";

export default function Home() {
  const pyth = usePythPrices();
  const [selectedVault, setSelectedVault] = useState<VaultItem | null>(null);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState<boolean>(false);
  const [isFaucetOpen, setIsFaucetOpen] = useState<boolean>(false);

  const activeVaults: VaultItem[] = [
    {
      symbol: "xNVDA",
      name: "NVIDIA Corporation",
      color: "#76b900",
      price: pyth.xNVDA.price,
      premium: "8.4%",
      strike: `$${(pyth.xNVDA.numericPrice * 1.05).toFixed(2)}`,
      cycle: 2,
      status: "Active",
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
    <main className={styles.shell}>
      {/* 1. Minimal Sticky Navigation */}
      <Navbar
        onOpenPortfolio={() => setIsPortfolioOpen(true)}
        onOpenFaucet={() => setIsFaucetOpen(true)}
      />

      {/* 2. Hero: Headline + Large Vault Card Object */}
      <Hero
        onSelectVault={setSelectedVault}
        featuredVault={activeVaults[0]}
      />

      {/* 3. Live Harvest Strip (Dark Horizontal Status Band) */}
      <LiveHarvestStrip />

      {/* 4. The Idea: Conceptual explanation and flow */}
      <ConceptSection />

      {/* 5. The Harvest Cycle: 01 Deposit -> 02 Harvest -> 03 Settle */}
      <HarvestCycle />

      {/* 6. Product Showcase: xNVDA, xAAPL, xTSLA */}
      <VaultGrid
        vaults={activeVaults}
        onSelectVault={setSelectedVault}
      />

      {/* 7 & 8. Strategy Explanation & Interactive Payoff Visualizer (Dark Contrast) */}
      <StrategySection />

      {/* 9. Why Harvest: Weekly · Non-custodial · Transparent */}
      <WhyHarvest />

      {/* 10. Infrastructure: Solana · Pyth · xStocks */}
      <Infrastructure />

      {/* 11. Risks: Yield with nothing hidden */}
      <RiskSection />

      {/* 12. Final CTA: Your xStocks can do more than sit there */}
      <FinalCTA />

      {/* 13. Minimal Footer */}
      <Footer />

      {/* Interactive Deposit / Claim Modal */}
      {selectedVault && (
        <VaultModal
          vault={selectedVault}
          onClose={() => setSelectedVault(null)}
          onOpenFaucet={() => setIsFaucetOpen(true)}
        />
      )}

      {/* Slide-over Portfolio Drawer */}
      <PortfolioDrawer
        isOpen={isPortfolioOpen}
        onClose={() => setIsPortfolioOpen(false)}
      />

      {/* 1-Click Devnet Faucet Modal */}
      <FaucetModal
        isOpen={isFaucetOpen}
        onClose={() => setIsFaucetOpen(false)}
      />
    </main>
  );
}
