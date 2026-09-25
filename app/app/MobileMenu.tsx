"use client";

import type { MouseEvent } from "react";

type NavigationItem = {
  label: string;
  href: string;
};

type MobileMenuProps = {
  className: string;
  items: readonly NavigationItem[];
  onOpenFaucet?: () => void;
  onOpenPortfolio?: () => void;
};

export function MobileMenu({ className, items, onOpenFaucet, onOpenPortfolio }: MobileMenuProps) {
  function closeMenu(event: MouseEvent<HTMLElement>) {
    event.currentTarget.closest("details")?.removeAttribute("open");
  }

  return (
    <details className={className}>
      <summary>Menu</summary>
      <nav aria-label="Mobile navigation">
        {items.map((item) => (
          <a key={item.label} href={item.href} onClick={closeMenu}>
            {item.label}
          </a>
        ))}
        {onOpenFaucet && (
          <button
            type="button"
            onClick={(e) => {
              closeMenu(e);
              onOpenFaucet();
            }}
            style={{
              textAlign: "left",
              minHeight: "42px",
              padding: "12px",
              borderBottom: "1px solid var(--line)",
              color: "var(--accent-gold)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Devnet Faucet ↗
          </button>
        )}
        {onOpenPortfolio && (
          <button
            type="button"
            onClick={(e) => {
              closeMenu(e);
              onOpenPortfolio();
            }}
            style={{
              textAlign: "left",
              minHeight: "42px",
              padding: "12px",
              color: "var(--ink)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            View Portfolio
          </button>
        )}
      </nav>
    </details>
  );
}
