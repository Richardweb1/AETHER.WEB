import { NextResponse } from "next/server";
import { buildMemoryEntry, storeMemory } from "@/lib/shelby-service";
import { saveToIndex } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const walletAddr = String(body.wallet_address || "0xanonymous");
    const txHash = String(body.txHash || "");
    const fromToken = String(body.fromToken || "");
    const toToken = String(body.toToken || "");
    const amount = String(body.amount || "");
    const expectedOut = String(body.expectedOut || "");
    const network = String(body.network || "aptos-testnet");
    const isReviewMode = Boolean(body.reviewMode || body.quote?.reviewMode);

    if (!txHash || !fromToken || !toToken || !amount) {
      return NextResponse.json({ success: false, error: "Missing swap transaction details." }, { status: 400 });
    }

    const response = [
      isReviewMode ? "Testnet review swap completed and recorded on Shelby." : "Swap executed and recorded on Shelby.",
      `Network: ${network}.`,
      `Request: ${amount} ${fromToken} -> ${toToken}.`,
      expectedOut ? `Quoted output: ${expectedOut} ${toToken}.` : "",
      isReviewMode ? `Wallet approval: ${txHash}` : `Transaction: ${txHash}`,
    ].filter(Boolean).join("\n");

    const entry = buildMemoryEntry(
      `${isReviewMode ? "signed review swap" : "executed swap"} ${amount} ${fromToken} to ${toToken}`,
      response,
      walletAddr,
      {
        feature: "swap",
        dex: "Liquidswap",
        network,
        status: isReviewMode ? "signed_intent" : "executed",
        txHash,
        quote: body.quote ?? null,
      }
    );

    const result = await storeMemory(entry);

    saveToIndex({
      cid: `memory-${result.timestamp}`,
      blobName: result.blobName,
      agent_id: entry.agent_id,
      wallet_address: walletAddr,
      timestamp: result.timestamp,
      preview: `${isReviewMode ? "Signed review swap" : "Executed swap"} (${network}): ${amount} ${fromToken} -> ${toToken}`,
      prompt: entry.interaction.prompt,
      response,
      metadata: entry.metadata,
    });

    return NextResponse.json({
      success: true,
      aiResponse: response,
      stored_on_shelby: result.success,
      blobName: result.blobName,
      explorerUrl: result.explorerUrl,
      timestamp: result.timestamp,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not record swap" },
      { status: 500 }
    );
  }
}
