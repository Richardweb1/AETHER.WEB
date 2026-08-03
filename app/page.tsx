"use client";
import { useState } from "react";
import { Brain, MessageSquare, Database, Zap } from "lucide-react";
import ChatBox from "@/components/chat/ChatBox";
import MemoryDashboard from "@/components/dashboard/MemoryDashboard";
import WalletConnect from "@/components/wallet/WalletConnect";

export default function Home() {
  const [view, setView] = useState<"chat" | "dashboard">("chat");
  const [wallet, setWallet] = useState<string>("");
  return (
    <main className="flex min-h-screen flex-col items-center p-8 space-y-8">
      <div className="w-full max-w-5xl flex justify-between items-center p-6 glass rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-600 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            AETHER.WEB
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex gap-2">
            <button onClick={() => setView("chat")} className={`px-4 py-2 rounded-lg transition ${view === "chat" ? "bg-violet-600/20 text-violet-400 border border-violet-500/30" : "hover:bg-white/5"}`}>
              <MessageSquare className="w-4 h-4 inline mr-2" /> Chat
            </button>
            <button onClick={() => setView("dashboard")} className={`px-4 py-2 rounded-lg transition ${view === "dashboard" ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/30" : "hover:bg-white/5"}`}>
              <Database className="w-4 h-4 inline mr-2" /> Storage
            </button>
          </nav>
          <WalletConnect onWalletChange={setWallet} />
        </div>
      </div>
      <div className="w-full max-w-5xl flex-1 flex flex-col">
        {view === "chat" ? <ChatBox wallet={wallet} /> : <MemoryDashboard wallet={wallet} />}
      </div>
      <div className="w-full max-w-5xl flex justify-around p-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-yellow-500" />
          <span>Shelby Hot Storage: Active</span>
        </div>
        <div>DEX: Aptos Mainnet</div>
        <div>SDK: 0.2.4</div>
      </div>
    </main>
  );
}
