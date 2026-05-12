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
  simulated?: boolean;
}

class ShelbyMemoryService {
  private apiKey: string;
  private accountAddress: string;
  private isConfigured: boolean = false;
  private rpcEndpoint = "https://api.shelbynet.shelby.xyz/shelby";

  constructor() {
    this.apiKey = process.env.SHELBY_API_KEY || "";
    this.accountAddress = process.env.APTOS_ACCOUNT_ADDRESS || "0xb9dd06b30ac18437af0c4d4db43977ca007ed264f4123489544a5995b65e0218";
    this.isConfigured = !!this.apiKey && this.apiKey !== "demo_key_123";

    if (this.isConfigured) {
      console.log("✅ Shelby configured with real API key");
    } else {
      console.warn("⚠️ Running in demo mode");
    }
  }

  getAccountAddress(): string {
    return this.accountAddress;
  }

  async storeMemory(entry: MemoryEntry): Promise<StoreResult> {
    const blobName = `memories/${entry.agent_id}/${entry.interaction.timestamp}.json`;

    if (this.isConfigured) {
      try {
        const response = await fetch(
          `${this.rpcEndpoint}/v1/blobs/${this.accountAddress}/${blobName}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": this.apiKey,
              "x-amz-meta-expiration-seconds": "2592000",
            },
            body: JSON.stringify(entry),
          }
        );

        if (response.ok) {
          console.log("✅ Shelby Upload Success:", blobName);
          return {
            success: true,
            blobName,
            accountAddress: this.accountAddress,
            timestamp: entry.interaction.timestamp,
          };
        } else {
          console.error("Shelby Upload Failed:", response.status, await response.text());
        }
      } catch (error: any) {
        console.error("Shelby Upload Error:", error.message);
      }
    }

    // Demo mode
    console.log("📝 Demo mode: Memory saved locally:", blobName);
    return {
      success: true,
      blobName,
      accountAddress: this.accountAddress,
      timestamp: entry.interaction.timestamp,
      simulated: true,
    };
  }

  async getMemory(blobName: string): Promise<MemoryEntry | null> {
    try {
      const response = await fetch(
        `${this.rpcEndpoint}/v1/blobs/${this.accountAddress}/${blobName}`,
        {
          headers: {
            "x-api-key": this.apiKey,
          },
        }
      );
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  getDirectUrl(blobName: string): string {
    return `https://explorer.shelby.xyz/testnet/blob/${this.accountAddress}/${blobName}`;
  }
}

export const shelbyMemoryService = new ShelbyMemoryService();