"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Cpu, CheckCircle, Loader2, AlertCircle, ExternalLink, ArrowRightLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!wallet) { alert("Please connect your Petra wallet first!"); return; }
    const userMsg: ChatMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    const promptText = input;
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
  return (
    <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden min-h-[500px]">
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.length === 0 && (<div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4"><Cpu className="w-12 h-12 opacity-20" /><p className="text-center">{wallet ? "Start a conversation. Every interaction is stored on Shelby." : "Connect your Petra wallet to start chatting."}</p></div>)}
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
