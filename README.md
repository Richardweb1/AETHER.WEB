<p align="center">
  <img src="https://raw.githubusercontent.com/Richardweb1/AETHER.WEB/main/public/aether-banner.png.webp" alt="AETHER.WEB" width="100%"/>
</p>

# AETHER.WEB

Decentralized AI memory and wallet actions, built on Shelby Protocol.

AETHER.WEB gives an AI agent a verifiable memory layer on Shelby hot storage. Every useful chat interaction can be saved as a JSON blob tied to the user's Aptos wallet, and the agent can also guide a user through real APT transfers with Petra.

Live demo: https://aether-web-xi.vercel.app  
GitHub: https://github.com/Richardweb1/AETHER.WEB

---

## What It Does

AETHER.WEB turns a normal AI chat into an on-chain memory and action assistant:

- Chat with the AI through a wallet-connected interface.
- Store AI interactions as real JSON blobs on Shelby Protocol.
- Link each memory to the user's Aptos wallet address.
- Browse stored memories from the storage dashboard.
- Ask the bot to send APT in natural language.
- Let the app collect missing transfer details like amount or recipient address.
- Sign the transaction in Petra.
- Save the completed transfer record back to Shelby as verifiable memory.

Example flow:

```text
User: send apt
AI: How much APT do you want to send?
User: 0.1
AI: Send it to which Aptos address?
User: 0x2b1a...
AI: Shows transfer preview
User: Confirms in Petra
AI: Transfer sent and saved to Shelby memory
```

---

## Why Shelby

AI agents normally forget everything between sessions. That is a problem for useful assistants, especially when the agent is helping with wallet actions, research, decisions, or workflows that need history.

Shelby gives AETHER.WEB a hot storage layer for AI memory:

- Fast retrieval for real-time agent context.
- Verifiable blob records connected to Aptos.
- Wallet-linked memory ownership.
- Persistent records for chat and transaction history.

---

## Architecture

```text
User
  |
  v
Next.js Chat UI
  |
  |-- Normal message --> AI API --> Shelby memory blob
  |
  |-- Transfer request --> Intent parser --> Petra wallet signing
                                      |
                                      v
                              Aptos Testnet transaction
                                      |
                                      v
                              Shelby transfer memory blob
```

---

## Memory Schema

Normal AI memory:

```json
{
  "agent_id": "Shelby-Alpha-01",
  "wallet_address": "0x...",
  "interaction": {
    "prompt": "What is decentralized storage?",
    "response": "Decentralized storage distributes data across nodes...",
    "timestamp": 1786024906096
  },
  "metadata": {
    "source": "AETHER.WEB",
    "version": "1.0.0"
  }
}
```

Token transfer memory:

```json
{
  "agent_id": "Shelby-Alpha-01",
  "wallet_address": "0x...",
  "interaction": {
    "prompt": "send 0.1 APT to 0x...",
    "response": "Transfer sent and saved to Shelby memory.",
    "timestamp": 1786024906096
  },
  "metadata": {
    "source": "AETHER.WEB",
    "version": "1.0.0",
    "memory_type": "token_transfer",
    "transfer": {
      "token": "APT",
      "amount": "0.1",
      "recipient": "0x...",
      "amountOctas": "10000000"
    },
    "tx_hash": "0x..."
  }
}
```

---

## Features

- Verifiable AI memory stored on Shelby.
- Wallet identity through Petra.
- Natural-language APT transfer assistant.
- Step-by-step transfer collection when the user gives incomplete details.
- Petra confirmation before any transaction is submitted.
- Transfer receipts saved as Shelby blobs.
- Storage dashboard for saved memories.
- Smart fallback responses when the LLM is unavailable.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TailwindCSS 4 |
| AI Engine | OpenRouter-compatible chat API |
| Storage | Shelby Protocol SDK (`@shelby-protocol/sdk`) |
| Blockchain | Aptos Testnet (`@aptos-labs/ts-sdk`) |
| Wallet | Petra / Aptos Wallet Adapter |
| Animations | Framer Motion |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Petra wallet on Aptos testnet
- Shelby API access

### Installation

```bash
git clone https://github.com/Richardweb1/AETHER.WEB.git
cd AETHER.WEB
npm install
```

### Environment Setup

Create `.env.local`:

```env
SHELBY_API_KEY=your_shelby_key
OPENROUTER_API_KEY=your_openrouter_key
```

### Run Locally

```bash
npm run dev
```

Open http://localhost:3000 for local development.

---

## Status

AETHER.WEB is live as a working Shelby demo:

- AI chat interactions are saved to Shelby.
- APT transfer intents are detected from chat.
- Petra is used for transaction signing.
- Completed transfer actions are stored as Shelby memory blobs.

Built for the Shelby ecosystem on Aptos.
