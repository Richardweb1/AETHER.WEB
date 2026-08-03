// In-memory storage for Vercel (read-only filesystem)
interface MemoryIndex {
  cid: string;
  blobName?: string;
  agent_id: string;
  wallet_address: string;
  timestamp: number;
  preview: string;
  prompt?: string;
  response?: string;
  metadata?: Record<string, unknown>;
}

const memoryStore: MemoryIndex[] = [];

export function saveToIndex(entry: MemoryIndex): void {
  try {
    memoryStore.unshift(entry);
    if (memoryStore.length > 100) {
      memoryStore.pop();
    }
  } catch (e) {
    console.error("Failed to save to index:", e);
  }
}

export function getIndex(): MemoryIndex[] {
  return memoryStore;
}
