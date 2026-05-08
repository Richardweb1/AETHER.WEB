import { NextResponse } from 'next/server';
import { shelbyMemoryService } from '@/lib/shelby-service';
import { saveToIndex, getIndex } from '@/lib/db';
import { generateAIResponse } from '@/lib/ai-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agent_id, wallet_address, prompt } = body;

    const timestamp = Date.now();
    const agentId = agent_id || "Shelby-Alpha-01";
    const walletAddr = wallet_address || "0x789...abcd";

    // 1. Generate real AI response
    const aiResponse = await generateAIResponse(prompt);

    // 2. Build memory entry
    const entry = {
      agent_id: agentId,
      wallet_address: walletAddr,
      interaction: {
        prompt,
        response: aiResponse,
        timestamp
      },
      metadata: {
        source: "Shelby AI Memory",
        version: "1.0.0"
      }
    };

    // 3. Attempt Shelby upload
    const result = await shelbyMemoryService.storeMemory(entry);

    const blobName = result.blobName;
    const directUrl = shelbyMemoryService.getDirectUrl(blobName);

    // 4. Save to local index
    saveToIndex({
      cid: blobName,
      agent_id: agentId,
      wallet_address: walletAddr,
      timestamp,
      preview: (prompt || "").substring(0, 50) + "..."
    });

    return NextResponse.json({
      success: true,
      aiResponse,
      stored_on_shelby: result.success,
      blobName,
      accountAddress: result.accountAddress,
      directUrl,
      timestamp
    });
  } catch (error: any) {
    console.error("Memory API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet');
  const agent = searchParams.get('agent');

  let index = getIndex();

  if (wallet) {
    index = index.filter(e => e.wallet_address === wallet);
  }
  if (agent) {
    index = index.filter(e => e.agent_id === agent);
  }

  index.sort((a, b) => b.timestamp - a.timestamp);

  return NextResponse.json(index);
}
