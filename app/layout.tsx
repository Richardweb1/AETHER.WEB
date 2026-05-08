import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shelby AI Memory | Verifiable Long-Term Memory",
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
        {children}
      </body>
    </html>
  );
}
