import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import SolanaWalletProvider from "./components/WalletProvider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Harvest — Weekly Yield on xStocks",
  description:
    "Hold your xStocks. Earn weekly USDC yield. Non-custodial covered-call vaults on Solana.",
};

export const viewport: Viewport = {
  themeColor: "#151515",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={geistSans.variable}>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </body>
    </html>
  );
}
