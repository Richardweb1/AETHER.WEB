<p align="center">
  <img src="https://raw.githubusercontent.com/Richardweb1/AETHER.WEB/main/public/aether-banner.png.webp" alt="AETHER.WEB" width="100%"/>
</p>

**Decentralized Long-Term Memory for AI Agents — Built on Shelby Protocol**

> Give your AI agent a brain that never forgets, backed by verifiable decentralized hot storage on Aptos.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Shelby](https://img.shields.io/badge/Shelby_Protocol-Testnet-cyan)
![Aptos](https://img.shields.io/badge/Aptos-Blockchain-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)

## 🎯 The Problem

AI agents lose context between sessions. Every conversation is ephemeral — once the session ends, the AI forgets everything. For AI to be used in legal, financial, or sensitive environments, it needs a **permanent, verifiable memory**.

## 💡 The Solution

**Shelby AI Memory** stores every AI interaction as a JSON blob on **Shelby Protocol's decentralized hot storage**. Unlike cold storage (IPFS, Filecoin), Shelby offers:

- ⚡ **Millisecond retrieval** — Hot storage for real-time AI context
- 🔐 **Cryptographic receipts** — Every read is verifiable on Aptos
- 🌍 **Global availability** — Decentralized nodes across the network
- 🧠 **Persistent memory** — AI agents recall past conversations across sessions

## 🏗 Architecture

```
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
  "wallet_address": "0x789...abcd",
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

## 🚀 Features

- **Verifiable Chat** — Every AI response is stored on Shelby with a blob reference
- **Memory Dashboard** — Browse, search, and inspect stored memories
- **Multi-LLM Support** — Groq (Llama 3.3), Gemini, OpenAI
- **Wallet Identity** — Memories are associated with wallet addresses
- **Smart Fallback** — Topic-aware responses when LLM is unavailable

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TailwindCSS 4 |
| AI Engine | Gemini 2.0 Flash / Groq (Llama 3.3 70B) |
| Storage | Shelby Protocol SDK (`@shelby-protocol/sdk`) |
| Blockchain | Aptos Testnet (`@aptos-labs/ts-sdk`) |
| Animations | Framer Motion |

## 📦 Getting Started

### Prerequisites
- Node.js 20+
- npm

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/shelby-ai-memory.git
cd shelby-ai-memory
npm install
```

### Environment Setup

Create a `.env.local` file:

```env
# Shelby Protocol
SHELBY_API_KEY=aptoslabs_your_key_here

# LLM (choose one)
GEMINI_API_KEY=your_gemini_key
# GROQ_API_KEY=your_groq_key
# OPENAI_API_KEY=your_openai_key

# Optional: Aptos Account
# APTOS_PRIVATE_KEY=ed25519-priv-...
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
shelby/
├── app/
│   ├── api/memory/         # API routes for store/retrieve
│   ├── layout.tsx          # App layout
│   ├── page.tsx            # Main page with Chat & Dashboard
│   └── globals.css         # Design system
├── components/
│   ├── chat/ChatBox.tsx    # Chat interface with Shelby verification
│   └── dashboard/MemoryDashboard.tsx  # Memory browser
├── lib/
│   ├── shelby-service.ts   # Shelby SDK integration
│   ├── ai-service.ts       # Multi-LLM service (Gemini/Groq/OpenAI)
│   └── db.ts               # Local memory indexer
└── .env.local              # API keys (not committed)
```

## 🔮 Roadmap

- [ ] Real wallet connection (Petra/Pontem)
- [ ] Semantic search across memories (vector embeddings)
- [ ] Encrypted memory vaults (AES-GCM client-side)
- [ ] Cross-agent memory sharing
- [ ] Root CID registry on Aptos

## 📚 Resources

- [Shelby Protocol Docs](https://docs.staging.shelby.xyz/protocol)
- [Shelby TypeScript SDK](https://docs.staging.shelby.xyz/sdks/typescript)
- [Aptos Developer Docs](https://aptos.dev)

## 📄 License

MIT

---

*Built for the Shelby Ecosystem 🛡️*
