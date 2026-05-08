import { ShelbyNodeClient } from '@shelby-protocol/sdk/node';
import { Network, Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';

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
}

class ShelbyMemoryService {
  private client: ShelbyNodeClient;
  private account: any;
  private isConfigured: boolean = false;

  constructor() {
    const apiKey = process.env.SHELBY_API_KEY;
    const privateKey = process.env.APTOS_PRIVATE_KEY;

    // Initialize client
    this.client = new ShelbyNodeClient({
      network: Network.TESTNET,
      apiKey: apiKey || "aptoslabs_default",
    });

    // Set up account
    if (privateKey) {
      try {
        const pk = new Ed25519PrivateKey(privateKey);
        this.account = Account.fromPrivateKey({ privateKey: pk });
        this.isConfigured = true;
        console.log(
          "✅ Loaded Aptos account:",
          this.account.accountAddress.toString()
        );
      } catch (e1: any) {
        console.error("❌ Failed to load private key:", e1.message);
        try {
          const rawHex = privateKey.replace("ed25519-priv-", "");
          const pk2 = new Ed25519PrivateKey(rawHex);
          this.account = Account.fromPrivateKey({ privateKey: pk2 });
          this.isConfigured = true;
          console.log(
            "✅ Loaded Aptos account (raw hex):",
            this.account.accountAddress.toString()
          );
        } catch (e2: any) {
          console.error("❌ Failed to load private key (raw hex):", e2.message);
          this.account = Account.generate();
          console.warn(
            "⚠️  Falling back to generated account:",
            this.account.accountAddress.toString()
          );
        }
      }
    } else {
      this.account = Account.generate();
      console.warn(
        "⚠️  No APTOS_PRIVATE_KEY found. Generated a new account:",
        this.account.accountAddress.toString(),
        "\n   Fund it with APT and ShelbyUSD to enable real uploads."
      );
      this.isConfigured = !!apiKey;
    }
  }

  getAccountAddress(): string {
    return this.account.accountAddress.toString();
  }

  /**
   * Stores a JSON interaction as a named blob in Shelby.
   */
  async storeMemory(entry: MemoryEntry): Promise<StoreResult> {
    const blobName = `memories/${entry.agent_id}/${entry.interaction.timestamp}.json`;
    const data = JSON.stringify(entry);
    const blobData = Buffer.from(data);

    try {
      // Upload to Shelby — SDK uses "signer" not "account"
      await this.client.upload({
        signer: this.account,
        blobData,
        blobName,
        expirationMicros: (1000 * 60 * 60 * 24 * 30 + Date.now()) * 1000,
      });

      console.log("✅ Shelby Upload Success:", blobName);
      return {
        success: true,
        blobName,
        accountAddress: this.getAccountAddress(),
        timestamp: entry.interaction.timestamp,
      };
    } catch (error: any) {
      console.error("Shelby Upload Error:", error.message || error);
      return {
        success: false,
        blobName,
        accountAddress: this.getAccountAddress(),
        timestamp: entry.interaction.timestamp,
      };
    }
  }

  /**
   * Retrieves a memory entry by blob name.
   */
  async getMemory(blobName: string): Promise<MemoryEntry | null> {
    try {
      const blob = await this.client.download({
        account: this.account.accountAddress,
        blobName,
      });

      // ShelbyBlob may have data/content directly
      const blobAny = blob as any;
      let text: string;

      if (blobAny.stream) {
        const chunks: Buffer[] = [];
        for await (const chunk of blobAny.stream) {
          chunks.push(Buffer.from(chunk));
        }
        text = Buffer.concat(chunks).toString('utf-8');
      } else if (blobAny.data) {
        text = typeof blobAny.data === 'string' ? blobAny.data : JSON.stringify(blobAny.data);
      } else if (blobAny.content) {
        text = typeof blobAny.content === 'string' ? blobAny.content : JSON.stringify(blobAny.content);
      } else {
        text = JSON.stringify(blobAny);
      }

      return JSON.parse(text);
    } catch (error: any) {
      console.error("Shelby Download Error:", error.message || error);
      return null;
    }
  }

  /**
   * Direct HTTP retrieval via Shelby RPC endpoint.
   */
  getDirectUrl(blobName: string): string {
    const addr = this.getAccountAddress();
    return `https://api.testnet.shelby.xyz/shelby/v1/blobs/${addr}/${blobName}`;
  }
}

// Singleton
export const shelbyMemoryService = new ShelbyMemoryService();
