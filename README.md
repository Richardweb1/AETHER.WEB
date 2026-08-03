# AETHER.WEB

Memory-enabled AI agent with Shelby hot storage and an integrated Aptos swap flow.

Live demo: [aether-web-shelby-swap.vercel.app](https://aether-web-shelby-swap.vercel.app)

GitHub: [Richardweb1/AETHER.WEB](https://github.com/Richardweb1/AETHER.WEB)

## What It Does

AETHER.WEB lets a user connect an Aptos wallet, chat with an AI agent, prepare swap requests, and store every meaningful interaction on Shelby Protocol.

The goal is simple: users should be able to ask the agent for something, continue the flow in the same interface, and keep a verifiable memory record of what happened.

## Core Features

- AI chat agent that answers questions and uses recent conversation context.
- Natural swap commands such as `swapi 1 APT to USDC testnet`.
- DEX panel that auto-fills amount, tokens, and network from chat intent.
- Aptos Mainnet Liquidswap quote and transaction payload flow.
- Aptos Testnet and ShelbyNet review swap flow using Petra message approval.
- Shelby storage record for chat responses, swap requests, wallet approvals, and completed review actions.
- Storage dashboard to inspect previously stored memories.
- Petra wallet identity, so records are tied to the connected wallet address.

## Why Shelby

AI agents usually lose context after a session. AETHER.WEB treats Shelby as the agent memory layer:

- Every chat response can become a Shelby memory.
- Swap requests and approvals are stored with wallet address, network, tokens, amount, and metadata.
- Stored records can be inspected later from the Storage tab.
- The app demonstrates hot-storage UX where agent actions are not just ephemeral UI events.

## Swap Modes

| Network | Mode | What Happens |
| --- | --- | --- |
| Aptos Mainnet | Real swap flow | Builds a Liquidswap quote and wallet transaction payload. |
| Aptos Testnet | Review flow | Petra signs a swap intent, then the approval is stored on Shelby. |
| ShelbyNet | Review flow | ShelbyNet swap intent can be signed and stored while router configuration is not available. |

Testnet and ShelbyNet review mode is intentional. Public Shelby docs provide network, faucet, storage, and contract information, but not a currently deployed DEX router with liquidity. The app still completes a wallet-approved, Shelby-stored swap review flow so teams can verify the product journey end to end.

## Example User Flows

### Chat With The Agent

1. Connect Petra wallet.
2. Ask the agent a question.
3. The response is stored on Shelby.
4. Open Storage to inspect the memory record.

### Prepare A Swap From Chat

Type:

```text
swapi 1 apt to usdc testnet
```

The agent prepares the DEX panel with:

- Network: Aptos Testnet
- Amount: 1
- From: APT
- To: USDC

Then click `Get Quote` and `Sign Review Swap`. The wallet approval is stored on Shelby.

### Check Swap Status

Type:

```text
check if swap confirmed
```

The agent checks the latest swap record in the chat context and reports whether it was recorded on Shelby.

## Architecture

```text
User
  |
  v
Next.js Chat UI
  |
  +--> Agent API
  |      |
  |      +--> AI response / swap intent parser
  |      |
  |      +--> Shelby SDK storage
  |
  +--> Swap API
         |
         +--> Liquidswap quote / payload on Aptos Mainnet
         |
         +--> Signed review intent on Aptos Testnet and ShelbyNet
```

## Memory Record Shape

```json
{
  "agent_id": "Shelby-Alpha-01",
  "wallet_address": "0x...",
  "interaction": {
    "prompt": "swapi 1 apt to usdc testnet",
    "response": "Swap route prepared...",
    "timestamp": 1785760000000
  },
  "metadata": {
    "source": "AETHER.WEB",
    "version": "1.0.0",
    "feature": "swap",
    "network": "aptos-testnet"
  }
}
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Wallet | Aptos Wallet Adapter, Petra |
| Aptos SDK | `@aptos-labs/ts-sdk` |
| DEX | `@pontem/liquidswap-sdk` |
| Storage | `@shelby-protocol/sdk` |
| UI | Framer Motion, Lucide icons |

## Environment Variables

Create `.env.local` for local development:

```bash
OPENROUTER_API_KEY=
SHELBY_API_KEY=
APTOS_MAINNET_NODE_URL=https://fullnode.mainnet.aptoslabs.com/v1
APTOS_TESTNET_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
```

Optional ShelbyNet router variables can be added when a deployed DEX/router is available:

```bash
LIQUIDSWAP_SHELBYNET_ACCOUNT=
LIQUIDSWAP_SHELBYNET_RESOURCE_ACCOUNT=
SHELBYNET_USDC_TYPE=
SHELBYNET_USDT_TYPE=
```

## Local Development

```bash
git clone https://github.com/Richardweb1/AETHER.WEB.git
cd AETHER.WEB
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Project Goal

AETHER.WEB is built to show that an AI agent can do more than answer text. It can understand a user request, prepare an action such as a swap, ask for wallet approval, and store the result on Shelby so the interaction becomes durable and inspectable.

Built for the Shelby ecosystem by [Richardweb1](https://github.com/Richardweb1).
