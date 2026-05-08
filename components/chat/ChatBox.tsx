"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Cpu, CheckCircle, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  status?: "thinking" | "storing" | "stored" | "simulated" | "error";
  blobName?: string;
  directUrl?: string;
  storedOnShelby?: boolean;
}

export default function ChatBox({ wallet }: { wallet: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: ChatMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    const promptText = input;
    setInput("");
    setIsLoading(true);

    // Add thinking placeholder
    const thinkingMsg: ChatMessage = { role: "assistant", content: "", status: "thinking" };
    setMessages(prev => [...prev, thinkingMsg]);

    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: "Shelby-Alpha-01",
          wallet_address: wallet,
          prompt: promptText,
        })
      });
      const data = await res.json();
      
      if (data.success && data.aiResponse) {
        // Replace thinking message with real response
        setMessages(prev => {
          const updated = [...prev];
          const thinkIdx = updated.findIndex(m => m.status === "thinking");
          if (thinkIdx !== -1) {
            updated[thinkIdx] = {
              role: "assistant",
              content: data.aiResponse,
              status: data.stored_on_shelby ? "stored" : "simulated",
              blobName: data.blobName,
              directUrl: data.directUrl,
              storedOnShelby: data.stored_on_shelby
            };
          }
          return updated;
        });
      } else {
        setMessages(prev => {
          const updated = [...prev];
          const thinkIdx = updated.findIndex(m => m.status === "thinking");
          if (thinkIdx !== -1) {
            updated[thinkIdx] = {
              role: "assistant",
              content: data.error || "Something went wrong.",
              status: "error"
            };
          }
          return updated;
        });
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        const thinkIdx = updated.findIndex(m => m.status === "thinking");
        if (thinkIdx !== -1) {
          updated[thinkIdx] = {
            role: "assistant",
            content: "Connection error. Please try again.",
            status: "error"
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden min-h-[500px]">
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <Cpu className="w-12 h-12 opacity-20" />
            <p className="text-center">Start a conversation. Every interaction is stored<br/>on Shelby&apos;s decentralized hot storage.</p>
          </div>
        )}
        
        <AnimatePresence>
          {messages.map((m, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx} 
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                m.role === 'user' 
                  ? 'bg-violet-600 text-white rounded-br-none' 
                  : 'bg-white/5 border border-white/10 rounded-bl-none'
              }`}>
                {/* Thinking Animation */}
                {m.status === 'thinking' ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                )}
                
                {/* Storage status badges */}
                {m.status === 'stored' && m.blobName && (
                  <div className="mt-3 pt-2 border-t border-white/10 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-emerald-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Stored on Shelby (On-Chain)
                      </span>
                      {m.directUrl && (
                        <a href={m.directUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono truncate">
                      {m.blobName}
                    </div>
                  </div>
                )}

                {m.status === 'simulated' && m.blobName && (
                  <div className="mt-3 pt-2 border-t border-white/10 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-cyan-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Indexed Locally
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono truncate">
                      {m.blobName}
                    </div>
                  </div>
                )}

                {m.status === 'error' && (
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2 text-[10px] text-red-400">
                    <AlertCircle className="w-3 h-3" /> Storage failed
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white/5 border-t border-white/10 relative">
        <div className="flex gap-2">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Shelby AI anything..."
            disabled={isLoading}
            className="flex-1 bg-transparent border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="p-3 bg-violet-600 rounded-xl hover:bg-violet-500 transition disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Send className="w-5 h-5 text-white" />}
          </button>
        </div>
        
        {isLoading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-violet-600/20 overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}
