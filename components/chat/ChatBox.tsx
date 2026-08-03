"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Cpu, CheckCircle, Loader2, AlertCircle, ExternalLink, ArrowRightLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

const SWAP_NETWORKS = [
  { id: "aptos-testnet", label: "Aptos Testnet" },
  { id: "aptos-mainnet", label: "Aptos Mainnet" },
  { id: "shelbynet", label: "ShelbyNet" },
] as const;

type SwapNetwork = typeof SWAP_NETWORKS[number]["id"];

const SWAP_TOKENS: Record<SwapNetwork, string[]> = {
  "aptos-testnet": ["APT", "USDC", "USDT"],
  "aptos-mainnet": ["APT", "USDC", "USDT", "WETH", "WBTC"],
  shelbynet: ["APT", "USDC", "USDT"],
};

const SHELBYNET_APT_FAUCET_URL = "https://faucet.shelbynet.shelby.xyz";
const SHELBYNET_USD_FAUCET_URL = "https://docs.shelby.xyz/apis/faucet/shelbyusd";

interface DexQuote {
  network: SwapNetwork;
  fromToken: string;
  toToken: string;
  amount: string;
  expectedOut: string;
  minOut: string;
  payload: {
    function: `${string}::${string}::${string}`;
    type_arguments: string[];
    arguments: string[];
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  status?: "thinking" | "storing" | "stored" | "error";
  blobName?: string;
  explorerUrl?: string;
  swapIntent?: {
    fromToken: string;
    toToken: string;
    amount: string;
    status: "recorded" | "needs_confirmation";
  } | null;
}
export default function ChatBox({ wallet }: { wallet: string }) {
  const { changeNetwork, signAndSubmitTransaction } = useWallet();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapAmount, setSwapAmount] = useState("");
  const [fromToken, setFromToken] = useState("APT");
  const [toToken, setToToken] = useState("USDC");
  const [swapNetwork, setSwapNetwork] = useState<SwapNetwork>("aptos-testnet");
  const [quote, setQuote] = useState<DexQuote | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { setQuote(null); }, [swapAmount, fromToken, toToken, swapNetwork]);
  useEffect(() => {
    const tokens = SWAP_TOKENS[swapNetwork];
    if (!tokens.includes(fromToken)) setFromToken(tokens[0]);
    if (!tokens.includes(toToken)) setToToken(tokens[1] ?? tokens[0]);
  }, [swapNetwork, fromToken, toToken]);
  const submitPrompt = async (promptText: string) => {
    if (!promptText.trim() || isLoading) return;
    if (!wallet) { alert("Please connect your Petra wallet first!"); return; }
    const userMsg: ChatMessage = { role: "user", content: promptText };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setMessages(prev => [...prev, { role: "assistant", content: "", status: "thinking" }]);
    try {
      const res = await fetch("/api/memory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wallet_address: wallet, prompt: promptText }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setMessages(prev => { const updated = [...prev]; const idx = updated.findIndex(m => m.status === "thinking"); if (idx !== -1) updated[idx] = { role: "assistant", content: data.aiResponse, status: "storing", swapIntent: data.swapIntent }; return updated; });
      await new Promise(r => setTimeout(r, 1000));
      setMessages(prev => { const updated = [...prev]; const idx = updated.findIndex(m => m.status === "storing"); if (idx !== -1) updated[idx] = { role: "assistant", content: data.aiResponse, status: data.stored_on_shelby ? "stored" : "error", blobName: data.blobName, explorerUrl: data.explorerUrl, swapIntent: data.swapIntent }; return updated; });
    } catch {
      setMessages(prev => { const updated = [...prev]; const idx = updated.findIndex(m => m.status === "thinking" || m.status === "storing"); if (idx !== -1) updated[idx] = { role: "assistant", content: "Something went wrong.", status: "error" }; return updated; });
    } finally { setIsLoading(false); }
  };
  const handleSend = async () => {
    await submitPrompt(input);
  };
  const addAssistantMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };
  const handleQuote = async () => {
    if (!swapAmount.trim()) {
      alert("Enter an amount first.");
      return;
    }
    if (fromToken === toToken) {
      alert("Choose two different tokens.");
      return;
    }
    setIsQuoting(true);
    try {
      const res = await fetch("/api/swap/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network: swapNetwork, fromToken, toToken, amount: swapAmount }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setQuote(data.quote);
      addAssistantMessage({
        role: "assistant",
        content: `Liquidswap quote ready on ${SWAP_NETWORKS.find((network) => network.id === swapNetwork)?.label}.\n${swapAmount} ${fromToken} -> about ${data.quote.expectedOut} ${toToken}\nMinimum after slippage: ${data.quote.minOut} ${toToken}`,
        status: "stored",
        swapIntent: { fromToken, toToken, amount: swapAmount, status: "recorded" },
      });
    } catch (error) {
      addAssistantMessage({
        role: "assistant",
        content: error instanceof Error ? error.message : "Could not get a DEX quote.",
        status: "error",
      });
    } finally {
      setIsQuoting(false);
    }
  };
  const handleConfirmSwap = async () => {
    if (!quote) return;
    setIsSwapping(true);
    try {
      if (quote.network === "aptos-testnet") {
        await changeNetwork(Network.TESTNET);
      }
      if (quote.network === "aptos-mainnet") {
        await changeNetwork(Network.MAINNET);
      }
      if (quote.network === "shelbynet") {
        await changeNetwork(Network.SHELBYNET);
      }
      const result = await signAndSubmitTransaction({
        data: {
          function: quote.payload.function,
          typeArguments: quote.payload.type_arguments,
          functionArguments: quote.payload.arguments,
        },
      });
      const txHash = result.hash;
      const res = await fetch("/api/swap/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: wallet,
          txHash,
          network: quote.network,
          fromToken: quote.fromToken,
          toToken: quote.toToken,
          amount: quote.amount,
          expectedOut: quote.expectedOut,
          quote,
        }),
      });
      const data = await res.json();
      addAssistantMessage({
        role: "assistant",
        content: data.aiResponse || `Swap submitted.\nTransaction: ${txHash}`,
        status: data.stored_on_shelby ? "stored" : "error",
        blobName: data.blobName,
        explorerUrl: data.explorerUrl,
        swapIntent: { fromToken: quote.fromToken, toToken: quote.toToken, amount: quote.amount, status: "recorded" },
      });
    } catch (error) {
      addAssistantMessage({
        role: "assistant",
        content: error instanceof Error ? error.message : "Swap was not confirmed.",
        status: "error",
      });
    } finally {
      setIsSwapping(false);
    }
  };
  return (
    <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden min-h-[500px]">
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-100">
            <ArrowRightLeft className="h-4 w-4 text-cyan-300" />
            Liquidswap DEX
            <span className="ml-auto text-[10px] font-normal uppercase tracking-wide text-cyan-300/70">
              {SWAP_NETWORKS.find((network) => network.id === swapNetwork)?.label}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-[150px_1fr_120px_120px_auto]">
            <select
              value={swapNetwork}
              onChange={(e) => setSwapNetwork(e.target.value as SwapNetwork)}
              disabled={isLoading || !wallet}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none transition focus:border-cyan-400/60 disabled:opacity-50"
            >
              {SWAP_NETWORKS.map((network) => <option key={network.id} value={network.id}>{network.label}</option>)}
            </select>
            <input
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
              placeholder="Amount"
              inputMode="decimal"
              disabled={isLoading || !wallet}
              className="min-w-0 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none transition focus:border-cyan-400/60 disabled:opacity-50"
            />
            <select
              value={fromToken}
              onChange={(e) => setFromToken(e.target.value)}
              disabled={isLoading || !wallet}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none transition focus:border-cyan-400/60 disabled:opacity-50"
            >
              {SWAP_TOKENS[swapNetwork].map((token) => <option key={token} value={token}>{token}</option>)}
            </select>
            <select
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
              disabled={isLoading || !wallet}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none transition focus:border-cyan-400/60 disabled:opacity-50"
            >
              {SWAP_TOKENS[swapNetwork].map((token) => <option key={token} value={token}>{token}</option>)}
            </select>
            <button
              onClick={handleQuote}
              disabled={isLoading || isQuoting || isSwapping || !wallet || fromToken === toToken}
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              {isQuoting ? "Quoting..." : "Get Quote"}
            </button>
          </div>
          {swapNetwork === "shelbynet" && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-cyan-50">
              <span className="text-slate-300">ShelbyNet</span>
              <a
                href={SHELBYNET_APT_FAUCET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/20 px-2 py-1 text-cyan-200 transition hover:border-cyan-300/50 hover:text-cyan-100"
              >
                APT faucet <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={`${SHELBYNET_USD_FAUCET_URL}${wallet ? `?address=${wallet}` : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/20 px-2 py-1 text-cyan-200 transition hover:border-cyan-300/50 hover:text-cyan-100"
              >
                ShelbyUSD faucet <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          {quote && (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-cyan-50">
              <span className="font-mono">{`${quote.amount} ${quote.fromToken} -> ${quote.expectedOut} ${quote.toToken}`}</span>
              <span className="text-xs text-slate-400">Min: {quote.minOut} {quote.toToken}</span>
              <button
                onClick={handleConfirmSwap}
                disabled={isSwapping || !wallet}
                className="ml-auto rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
              >
                {isSwapping ? "Confirming..." : "Confirm Swap"}
              </button>
            </div>
          )}
        </div>
        {messages.length === 0 && (<div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-4"><Cpu className="w-12 h-12 opacity-20" /><p className="text-center">{wallet ? "Start a conversation or swap on the selected network. Every interaction is stored on Shelby." : "Connect your Petra wallet to start chatting."}</p></div>)}
        <AnimatePresence>
          {messages.map((m, idx) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={"max-w-[80%] p-4 rounded-2xl " + (m.role === "user" ? "bg-violet-600 text-white rounded-br-none" : "bg-white/5 border border-white/10 rounded-bl-none")}>
                {m.status === "thinking" ? (<div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /><span>Thinking...</span></div>) : m.status === "storing" ? (<div className="space-y-2"><p className="text-sm whitespace-pre-wrap">{m.content}</p><div className="flex items-center gap-2 text-xs text-violet-400"><Loader2 className="w-3 h-3 animate-spin" /><span>Storing on Shelby...</span></div></div>) : (<p className="text-sm whitespace-pre-wrap">{m.content}</p>)}
                {m.swapIntent && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                    <ArrowRightLeft className="h-4 w-4 text-cyan-300" />
                    <span className="font-mono">
                      {m.swapIntent.amount || "?"} {m.swapIntent.fromToken || "?"} to {m.swapIntent.toToken || "?"}
                    </span>
                    <span className="ml-auto rounded bg-cyan-400/10 px-2 py-1 text-[10px] uppercase text-cyan-300">
                      {m.swapIntent.status === "recorded" ? "Recorded" : "Needs details"}
                    </span>
                  </div>
                )}
                {m.status === "stored" && m.blobName && (<div className="mt-3 pt-2 border-t border-white/10 space-y-1"><div className="flex items-center justify-between text-[10px] text-emerald-400"><span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Stored on Shelby</span>{m.explorerUrl && (<a href={m.explorerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">View <ExternalLink className="w-3 h-3" /></a>)}</div><div className="text-[9px] text-slate-500 font-mono truncate">{m.blobName}</div></div>)}
                {m.status === "error" && (<div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2 text-[10px] text-red-400"><AlertCircle className="w-3 h-3" /> Storage failed</div>)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      <div className="p-6 bg-white/5 border-t border-white/10">
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder={wallet ? "Ask Shelby AI anything..." : "Connect wallet first..."} disabled={isLoading || !wallet} className="flex-1 bg-transparent border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition disabled:opacity-50" />
          <button onClick={handleSend} disabled={isLoading || !wallet} className="p-3 bg-violet-600 rounded-xl hover:bg-violet-500 transition disabled:opacity-50">
            {isLoading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Send className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}
