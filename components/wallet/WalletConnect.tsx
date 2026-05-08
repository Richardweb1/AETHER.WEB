"use client";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Wallet, LogOut, Copy, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface WalletConnectProps {
  onWalletChange: (address: string) => void;
}

export default function WalletConnect({ onWalletChange }: WalletConnectProps) {
  const { connect, disconnect, account, connected, wallets } = useWallet();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (account?.address) {
      onWalletChange(account.address.toString());
    }
  }, [account]);

  const handleConnect = async () => {
    const petra = wallets?.find((w) => w.name === "Petra");
    if (petra) await connect(petra.name);
  };

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (connected && account) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-mono">
            {shortAddress(account.address.toString())}
          </span>
          <button onClick={copyAddress} className="hover:text-white transition">
            {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <button
          onClick={disconnect}
          className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition"
    >
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </button>
  );
}