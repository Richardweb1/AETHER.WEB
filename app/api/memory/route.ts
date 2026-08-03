import { NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai-service';
import { storeMemory, buildMemoryEntry } from '@/lib/shelby-service';
import { saveToIndex, getIndex } from '@/lib/db';
import { buildSwapResponse, parseSwapIntent } from '@/lib/swap-service';

const requestBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = requestBuckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    requestBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet');
  const memories = getIndex();

  if (!wallet) {
    return NextResponse.json(memories);
  }

  return NextResponse.json(
    memories.filter((entry) => entry.wallet_address === wallet || wallet === "0x000...0000")
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { wallet_address, prompt } = body;

    if (!prompt) {
      return NextResponse.json({ success: false, error: "No prompt provided" }, { status: 400 });
    }

    const walletAddr = wallet_address || "0xanonymous";

    const ip = req.headers.get('x-forwarded-for') || 
                req.headers.get('x-real-ip') || 
                'unknown';

    if (isRateLimited(`${ip}:${walletAddr}`)) {
      return NextResponse.json({ 
        success: false, 
        error: "Too many requests. Please wait a minute and try again." 
      }, { status: 429 });
    }

    const swapIntent = parseSwapIntent(prompt);
    const aiResponse = swapIntent ? buildSwapResponse(swapIntent) : await generateAIResponse(prompt);
    const entry = buildMemoryEntry(prompt, aiResponse, walletAddr, swapIntent ? { feature: "swap", swap: swapIntent } : {});
    const result = await storeMemory(entry);

    saveToIndex({
      cid: `memory-${result.timestamp}`,
      blobName: result.blobName,
      agent_id: entry.agent_id,
      wallet_address: walletAddr,
      timestamp: result.timestamp,
      preview: swapIntent
        ? `Swap: ${swapIntent.amount || "?"} ${swapIntent.fromToken || "?"} -> ${swapIntent.toToken || "?"}`
        : prompt.slice(0, 120),
      prompt,
      response: aiResponse,
      metadata: entry.metadata,
    });

    return NextResponse.json({
      success: true,
      aiResponse,
      stored_on_shelby: result.success,
      blobName: result.blobName,
      accountAddress: result.accountAddress,
      explorerUrl: result.explorerUrl,
      timestamp: result.timestamp,
      swapIntent,
    });

  } catch (error: unknown) {
    console.error("Memory API Error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
