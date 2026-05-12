<p align="center">

  <img src="https://raw.githubusercontent.com/Richardweb1/AETHER.WEB/main/public/aether-banner.png.webp" alt="AETHER.WEB" width="100%"/>

</p>

**Decentralized Long-Term Memory for AI Agents — Built on Shelby Protocol**

> Give your AI agent a brain that never forgets, backed by verifiable decentralized hot storage on Aptos.


 The Problem

AI agents lose context between sessions. Every conversation is ephemeral — once the session ends, the AI forgets everything. For AI to be used in legal, financial, or sensitive environments, it needs a **permanent, verifiable memory**.

 The Solution

Shelby AI Memory** stores every AI interaction as a JSON blob on **Shelby Protocol's decentralized hot storage**. Unlike cold storage (IPFS, Filecoin), Shelby offers:



 Architecture


User ──► Chat UI ──► Next.js API ──► Shelby SDK ──► Decentralized Storage
                         │                              (Aptos Testnet)
                         ▼
                    AI Response
                    (Gemini LLM)
```

### Memory Entry Schema

```json
{
  "agent_id": "Shelby-Alpha-01",
  "wallet_address": ,
  "interaction": {
    "prompt": "What is decentralized storage?",
    "response": "Decentralized storage distributes data across...",
    "timestamp": 1773197354115
  },
  "metadata": {
    "source": "Shelby AI Memory",
    "version": "1.0.0"
  }
}
```

# Features

- **Verifiable Chat** — Every AI response is stored on Shelby with a blob reference
- **Memory Dashboard** — Browse, search, and inspect stored memories
- **Multi-LLM Support** — Groq (Llama 3.3), Gemini, OpenAI
- **Wallet Identity** — Memories are associated with wallet addresses
- **Smart Fallback** — Topic-aware responses when LLM is unavailable

# Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TailwindCSS 4 |
| AI Engine | Gemini 2.0 Flash / Groq (Llama 3.3 70B) |
| Storage | Shelby Protocol SDK (`@shelby-protocol/sdk`) |
| Blockchain | Aptos Testnet (`@aptos-labs/ts-sdk`) |
| Animations | Framer Motion |

# Getting Started

# Prerequisites
- Node.js 20+
- npm

# Installation

```bash
git clone https://github.com/YOUR_USERNAME/shelby-ai-memory.git
cd shelby-ai-memory
npm install
```



 Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)






*Built for the Shelby Ecosystem 🛡️*
