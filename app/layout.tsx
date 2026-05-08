import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/components/wallet/WalletProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AETHER.WEB | Decentralized AI Memory",
  description: "Decentralized AI memory system built on Shelby Protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#05060f] text-slate-100 antialiased`}>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}