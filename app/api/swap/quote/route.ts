import { NextResponse } from "next/server";
import { buildLiquidswapQuote, DexNetwork, getDexNetworks, getSupportedDexTokens } from "@/lib/dex-service";

export async function GET() {
  return NextResponse.json({
    tokens: {
      "aptos-testnet": getSupportedDexTokens("aptos-testnet"),
      "aptos-mainnet": getSupportedDexTokens("aptos-mainnet"),
      shelbynet: getSupportedDexTokens("shelbynet"),
    },
    networks: getDexNetworks(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const quote = await buildLiquidswapQuote({
      network: String(body.network || "aptos-testnet") as DexNetwork,
      fromToken: String(body.fromToken || ""),
      toToken: String(body.toToken || ""),
      amount: String(body.amount || ""),
      slippage: body.slippage ? Number(body.slippage) : undefined,
    });

    return NextResponse.json({ success: true, quote });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not build swap quote" },
      { status: 400 }
    );
  }
}
