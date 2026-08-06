import { NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai-service';
import { storeMemory, buildMemoryEntry } from '@/lib/shelby-service';

// In-memory store for rate limiting
const ipRequests = new Map<string, number>();
const walletRequests = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      wallet_address,
      prompt,
      memory_type,
      transfer,
      tx_hash,
    } = body;

    if (!prompt) {
      return NextResponse.json({ success: false, error: "No prompt provided" }, { status: 400 });
    }

    const walletAddr = wallet_address || "0xanonymous";

    // Get IP address
    const ip = req.headers.get('x-forwarded-for') || 
                req.headers.get('x-real-ip') || 
                'unknown';

    // Check IP limit
    if (ip !== 'unknown' && ipRequests.has(ip)) {
      return NextResponse.json({ 
        success: false, 
        error: "You have already used your free AI request from this IP address." 
      }, { status: 429 });
    }

    // Check wallet limit
    if (walletAddr !== "0xanonymous" && walletRequests.has(walletAddr)) {
      return NextResponse.json({ 
        success: false, 
        error: "You have already used your free AI request with this wallet." 
      }, { status: 429 });
    }

    // Mark IP and wallet as used
    ipRequests.set(ip, 1);
    walletRequests.set(walletAddr, 1);

    const isTransferMemory = memory_type === "token_transfer";

    // 1. Generate AI response
    const aiResponse = isTransferMemory
      ? `Transfer confirmed. ${transfer?.amount || ""} ${transfer?.token || "APT"} was sent to ${transfer?.recipient || "the recipient"} and this wallet action is being saved to Shelby memory.`
      : await generateAIResponse(prompt);

    // 2. Build memory entry
    const entry = buildMemoryEntry(prompt, aiResponse, walletAddr, {
      memory_type: isTransferMemory ? "token_transfer" : "chat",
      transfer,
      tx_hash,
    });

    // 3. Store on Shelby
    const result = await storeMemory(entry);

    return NextResponse.json({
      success: true,
      aiResponse,
      stored_on_shelby: result.success,
      blobName: result.blobName,
      accountAddress: result.accountAddress,
      explorerUrl: result.explorerUrl,
      timestamp: result.timestamp,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Memory API failed";
    console.error("Memory API Error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
