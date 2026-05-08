"use client";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#05060f] text-slate-100 antialiased`}>
        <AptosWalletAdapterProvider
          autoConnect={false}
          optInWallets={["Petra"]}
          dappConfig={{ network: "testnet" as any }}
        >
          {children}
        </AptosWalletAdapterProvider>
      </body>
    </html>
  );
}