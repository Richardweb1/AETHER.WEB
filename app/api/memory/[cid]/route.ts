import { NextResponse } from 'next/server';
import { getIndex } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cid: string }> }
) {
  try {
    const { cid } = await params;
    const index = getIndex();
    const entry = index.find(e => e.cid === cid);

    if (!entry) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    // In production, this would fetch from Shelby:
    // const memory = await shelbyMemoryService.getMemory(cid);
    // For MVP, we return the indexed data
    return NextResponse.json({
      agent_id: entry.agent_id,
      wallet_address: entry.wallet_address,
      interaction: {
        prompt: entry.preview.replace("...", ""),
        response: "AI response stored on Shelby Protocol",
        timestamp: entry.timestamp
      },
      metadata: {
        source: "Shelby AI Memory MVP",
        cid: entry.cid
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
