"use client";

import type { MouseEvent } from "react";

type NavigationItem = {
  label: string;
  href: string;
};

type MobileMenuProps = {
  className: string;
  items: readonly NavigationItem[];
};

export function MobileMenu({ className, items }: MobileMenuProps) {
  function closeMenu(event: MouseEvent<HTMLAnchorElement>) {
    event.currentTarget.closest("details")?.removeAttribute("open");
  }

  return (
    <details className={className}>
      <summary>Menu</summary>
      <nav aria-label="Mobile navigation">
        {items.map((item) => <a key={item.label} href={item.href} onClick={closeMenu}>{item.label}</a>)}
      </nav>
    </details>
  );
}
