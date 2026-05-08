import fs from 'fs';
import path from 'path';

// Simple file-based DB for tracking CIDs associated with users
const DB_PATH = path.join(process.cwd(), 'memory_index.json');

export interface MemoryIndexEntry {
  cid: string;
  agent_id: string;
  wallet_address: string;
  timestamp: number;
  preview: string;
}

export function saveToIndex(entry: MemoryIndexEntry) {
  const index = getIndex();
  index.push(entry);
  fs.writeFileSync(DB_PATH, JSON.stringify(index, null, 2));
}

export function getIndex(): MemoryIndexEntry[] {
  if (!fs.existsSync(DB_PATH)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}
