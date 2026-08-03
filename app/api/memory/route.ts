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

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

function isSwapStatusQuestion(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return lower.includes("swap") && (
    lower.includes("check") ||
    lower.includes("confirm") ||
    lower.includes("confirmed") ||
    lower.includes("status") ||
    lower.includes("completed") ||
    lower.includes("wach") ||
    lower.includes("واش")
  );
}

function buildSwapStatusResponse(history: HistoryMessage[]): string {
  const lastSwapRecord = [...history]
    .reverse()
    .find((message) =>
      message.role === "assistant" &&
      /swap/i.test(message.content) &&
      /(completed|recorded|executed|stored on shelby|wallet approval|transaction)/i.test(message.content)
    );

  if (!lastSwapRecord) {
    return "I do not see a completed swap record in this chat yet. Run Get Quote and confirm/sign from the DEX box, then I can verify the Shelby record here.";
  }

  const lines = lastSwapRecord.content
    .split("\n")
    .filter((line) => /(completed|recorded|executed|network|request|quoted output|wallet approval|transaction)/i.test(line))
    .slice(0, 6);

  return [
    "Yes, the latest swap action in this chat is confirmed as recorded on Shelby.",
    ...lines,
  ].join("\n");
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
    const history: HistoryMessage[] = Array.isArray(body.history)
      ? body.history
          .filter((message: unknown) => {
            const item = message as Record<string, unknown>;
            return (item.role === "user" || item.role === "assistant") && typeof item.content === "string";
          })
          .map((message: unknown) => {
            const item = message as HistoryMessage;
            return { role: item.role, content: item.content };
          })
          .slice(-8)
      : [];

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

    const swapStatusQuestion = isSwapStatusQuestion(prompt);
    const swapIntent = swapStatusQuestion ? null : parseSwapIntent(prompt);
    const aiResponse = swapStatusQuestion
      ? buildSwapStatusResponse(history)
      : swapIntent
        ? buildSwapResponse(swapIntent)
        : await generateAIResponse(prompt, history);
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
