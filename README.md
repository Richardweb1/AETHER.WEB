<p align="center">
  <img src="https://raw.githubusercontent.com/Richardweb1/AETHER.WEB/main/public/aether-banner.png.webp" alt="AETHER.WEB" width="100%"/>
</p>

# AETHER.WEB
# Decentralized Long-Term Memory for AI Agents — Built on Shelby Protocol

> Give your AI agent a brain that never forgets, backed by verifiable decentralized hot storage on Aptos.

 **Live Demo: aether-web-xi.vercel.app https://aether-web-xi.vercel.app |  **GitHub:** Richardweb1/AETHER.WEB https://github.com/Richardweb1/AETHER.WEB

---

# The Problem
AI agents lose context between sessions. Every conversation is ephemeral once the session ends, the AI forgets everything. For AI to be used in legal, financial, or sensitive environments, it needs a *permanent, verifiable memory**.

# The Solution
AETHER.WEB stores every AI interaction as a JSON blob on *Shelby Protocol decentralized hot storage**. Unlike cold storage (IPFS, Filecoin), Shelby offers:

- Millisecond retrieval** — Hot storage for real-time AI context
- Cryptographic receipts** — Every read is verifiable on Aptos
- Global availability** — Decentralized nodes across the network
- Persistent memory** — AI agents recall past conversations across sessions

---

# Architecture
```
User ──► Chat UI ──► Next.js API ──► Shelby SDK ──► Decentralized Storage
                         │                              (Aptos Testnet)
                         ▼
                    AI Response
                    (Gemini LLM)
```

---

# Memory Schema
```json
{
  "agent_id": "Shelby-Alpha-01",
  "wallet_address": "0x...",
  "interaction": {
    "prompt": "What is decentralized storage?",
    "response": "Decentralized storage distributes data across...",
    "timestamp": 1773197354115
  },
  "metadata": {
    "source": "AETHER.WEB",
    "version": "1.0.0"
  }
}
```

---

# Features
-  Verifiable Chat** — Every AI response stored on Shelby with a blob reference
-  Memory Dashboard** — Browse, search, and inspect stored memories
- Multi-LLM Support** — Groq (Llama 3.3), Gemini, OpenAI
-  Wallet Identity** — Memories tied to your Aptos wallet address (Petra)
- Smart Fallback** — Topic-aware responses when LLM is unavailable

---

# Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TailwindCSS 4 |
| AI Engine | Gemini 2.0 Flash / Groq (Llama 3.3 70B) |
| Storage | Shelby Protocol SDK (`@shelby-protocol/sdk`) |
| Blockchain | Aptos Testnet (`@aptos-labs/ts-sdk`) |
| Wallet | Petra (Aptos Wallet Adapter) |
| Animations | Framer Motion |

---

# Getting Started

# Prerequisites
- Node.js 20+
- npm

# Installation
```bash
git clone https://github.com/Richardweb1/AETHER.WEB.git
cd AETHER.WEB
npm install
```

# Environment Setup
Create `.env.local`:
```
SHELBY_API_KEY=your_shelby_key
GEMINI_API_KEY=your_gemini_key
```

# Run
```bash
npm run dev
```

Open http://localhost:3000 http://localhost:3000 for local development

 Or visit the live demo: aether-web-xi.vercel.app https://aether-web-xi.vercel.app

---

## Built for the Shelby Ecosystem 

Built with ❤️ by Richard https://github.com/Richardweb1  powered by Shelby Protocol https://shelby.xyz on Aptos @shelbyserves

