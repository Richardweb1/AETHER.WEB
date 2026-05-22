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
  explorerUrl?: string;
  simulated?: boolean;
}

const APTOS_ACCOUNT_ADDRESS = process.env.APTOS_ACCOUNT_ADDRESS || "0xb9dd06b30ac18437af0c4d4db43977ca007ed264f4123489544a5995b65e0218";

export async function storeMemory(entry: MemoryEntry): Promise<StoreResult> {
  const timestamp = entry.interaction.timestamp;
  const blobName = `memories/${entry.agent_id}/${timestamp}.json`;
  const explorerUrl = `https://explorer.shelby.xyz/testnet/blob/${APTOS_ACCOUNT_ADDRESS}/${blobName}`;

  console.log("📝 Demo mode: Memory indexed:", blobName);
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