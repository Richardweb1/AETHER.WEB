import { ShelbyClient } from "@shelby-protocol/sdk/node";
import { Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

const SHELBY_API_KEY = process.env.SHELBY_API_KEY || "AG-MR5SFEFY8BSVMEMVG9YETVQBZJJ2QYEPF";
const APTOS_PRIVATE_KEY = process.env.APTOS_PRIVATE_KEY || "";
const APTOS_ACCOUNT_ADDRESS = process.env.APTOS_ACCOUNT_ADDRESS || "0x2b1abb3c4369ae67c04d4d8eb0758a7e2846a136dd48249b805fab871a974f39";

export interface MemoryEntry {
  agent_id: string;
  wallet_address: string;
  interaction: {
    prompt: string;
    response: string;
    timestamp: number;
  };
  metadata?: Record<string, any>;
}

export interface StoreResult {
  success: boolean;
  blobName: string;
  accountAddress: string;
  timestamp: number;
  txHash?: string;
  explorerUrl?: string;
  simulated?: boolean;
}

export async function storeMemory(entry: MemoryEntry): Promise<StoreResult> {
  const timestamp = entry.interaction.timestamp;
  const blobName = `memories/${entry.agent_id}/${timestamp}.json`;
  const explorerUrl = `https://explorer.shelby.xyz/shelbynet/account/${APTOS_ACCOUNT_ADDRESS}`;

  // Only try real upload if private key exists
  if (APTOS_PRIVATE_KEY) {
    try {
      const privateKey = new Ed25519PrivateKey(APTOS_PRIVATE_KEY);
      const account = Account.fromPrivateKey({ privateKey });

      const client = new ShelbyClient({
        network: "shelbynet" as any,
        aptos: {
          network: "shelbynet" as any,
          fullnode: "https://api.shelbynet.shelby.xyz/v1",
          indexer: "https://api.shelbynet.shelby.xyz/v1/graphql",
          clientConfig: { API_KEY: SHELBY_API_KEY },
        },
        shelby: {
          rpc: { baseUrl: "https://api.shelbynet.shelby.xyz/shelby" },
        },
      } as any);

      const blobData = new TextEncoder().encode(JSON.stringify(entry));
      const expirationMicros = (Date.now() + 30 * 24 * 60 * 60 * 1000) * 1000;

      await client.upload({ blobData, signer: account, blobName, expirationMicros });

      console.log("✅ Shelby Upload Success:", blobName);
      return { success: true, blobName, accountAddress: APTOS_ACCOUNT_ADDRESS, timestamp, explorerUrl };

    } catch (error: any) {
      console.error("❌ Shelby Upload Error:", error.message);
    }
  }

  // Demo mode
  console.log("📝 Demo mode:", blobName);
  return {
    success: true,
    blobName,
    accountAddress: APTOS_ACCOUNT_ADDRESS,
    timestamp,
    explorerUrl,
    simulated: true,
  };
}

export function buildMemoryEntry(
  prompt: string,
  response: string,
  walletAddress: string
): MemoryEntry {
  return {
    agent_id: "Shelby-Alpha-01",
    wallet_address: walletAddress,
    interaction: { prompt, response, timestamp: Date.now() },
    metadata: { source: "AETHER.WEB", version: "1.0.0" },
  };
}