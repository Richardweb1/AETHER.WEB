"use client";

import { useState, useEffect } from "react";
import { Search, Filter, ExternalLink, Calendar, Key, User } from "lucide-react";
import { motion } from "framer-motion";

interface MemoryListItem {
  cid: string;
  timestamp: number;
  preview: string;
}

interface MemoryDetail {
  cid?: string;
  agent_id: string;
  wallet_address: string;
  interaction: {
    prompt: string;
    response: string;
    timestamp: number;
  };
  metadata: Record<string, unknown>;
}

export default function MemoryDashboard({ wallet }: { wallet: string }) {
  const [memories, setMemories] = useState<MemoryListItem[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<MemoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/memory?wallet=${wallet}`);
      const data = await res.json();
      setMemories(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [wallet]);

  const fetchDetails = async (cid: string) => {
    const res = await fetch(`/api/memory/${cid}`);
    const data = await res.json();
    setSelectedMemory(data);
  };

  const filteredMemories = memories.filter(m => 
    m.preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cid.includes(searchTerm)
  );

  return (
    <div className="flex-1 flex gap-6 overflow-hidden">
      {/* List */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search memories..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading Shelby blobs...</div>
          ) : filteredMemories.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No memories found.</div>
          ) : (
            filteredMemories.map((m, idx) => (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={idx}
                onClick={() => fetchDetails(m.cid)}
                className={`p-4 rounded-xl cursor-pointer border transition ${
                  selectedMemory?.cid === m.cid 
                    ? "bg-cyan-500/10 border-cyan-500/50" 
                    : "bg-white/5 border-white/10 hover:border-white/30"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                    {new Date(m.timestamp).toLocaleDateString()}
                  </span>
                  <Key className="w-3 h-3 text-cyan-500 opacity-50" />
                </div>
                <p className="text-sm font-medium truncate">{m.preview}</p>
                <p className="text-[10px] font-mono text-slate-500 mt-2">CID: {m.cid.substring(0, 16)}...</p>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Detail View */}
      <div className="flex-1 glass rounded-2xl p-8 overflow-y-auto">
        {selectedMemory ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Memory Metadata
              </h2>
              <button className="text-xs px-3 py-1 rounded bg-white/5 hover:bg-white/10 flex items-center gap-2">
                Open in Explorer <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="text-[10px] text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> Agent
                </div>
                <div className="text-sm">{selectedMemory.agent_id}</div>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="text-[10px] text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Timestamp
                </div>
                <div className="text-sm">{new Date(selectedMemory.interaction.timestamp).toLocaleString()}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 uppercase block mb-2">Prompt</label>
                <div className="p-4 bg-violet-600/10 rounded-xl border border-violet-500/20 text-sm">
                  {selectedMemory.interaction.prompt}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase block mb-2">Response</label>
                <div className="p-4 bg-cyan-600/10 rounded-xl border border-cyan-500/20 text-sm">
                  {selectedMemory.interaction.response}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase block mb-2">Raw JSON Data (from Shelby)</label>
              <pre className="p-4 bg-black/40 rounded-xl text-[10px] font-mono text-cyan-300 overflow-x-auto">
                {JSON.stringify(selectedMemory, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
            <Filter className="w-12 h-12" />
            <p>Select a memory entry to view record details.</p>
          </div>
        )}
      </div>
    </div>
  );
}
