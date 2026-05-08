"use client";
import { useState, useEffect } from "react";
import { Wallet, LogOut, Copy, CheckCircle } from "lucide-react";

interface WalletConnectProps {
  onWalletChange: (address: string) => void;
}

export default function WalletConnect({ onWalletChange }: WalletConnectProps) {
  const [wallet, setWallet] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const petra = (window as any).petra || (window as any).aptos;
        if (petra) {
          const isConnected = await petra.isConnected();
          if (isConnected) {
            const acc = await petra.account();
            setWallet(acc.address);
            onWalletChange(acc.address);
          }
        }
      } catch (e) {}
    };
    setTimeout(check, 500);
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const petra = (window as any).petra || (window as any).aptos;
      if (!petra) {
        setError("Install Petra Wallet first!");
        setIsConnecting(false);
        return;
      }
      const acc = await petra.connect();
      const address = acc.address || acc.publicKey;
      setWallet(address);
      onWalletChange(address);
    } catch (e: any) {
      if (e.code === 4001) {
        setError("You rejected the connection.");
      } else {
        setError("Try again.");
      }
    }
    setIsConnecting(false);
  };

  const disconnectWallet = async () => {
    try {
      const petra = (window as any).petra || (window as any).aptos;
      if (petra) await petra.disconnect();
    } catch (e) {}
    setWallet(null);
    onWalletChange("0x000...0000");
  };

  const copyAddress = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (wallet) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-mono">{shortAddress(wallet)}</span>
          <button onClick={copyAddress} className="hover:text-white transition">
            {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <button onClick={disconnectWallet} className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition disabled:opacity-50"
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>
      {error && (
        <div className="text-xs text-red-400 text-right">
          {error}{" "}
          {error.includes("Install") && (
            <a href="https://petra.app" target="_blank" rel="noopener noreferrer" className="underline">Get Petra</a>
          )}
        </div>
      )}
    </div>
  );
}