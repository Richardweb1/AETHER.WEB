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
    const network = String(body.network || "aptos-testnet") as DexNetwork;
    const fromToken = String(body.fromToken || "").toUpperCase();
    const toToken = String(body.toToken || "").toUpperCase();
    const amount = String(body.amount || "");

    if ((network === "aptos-testnet" || network === "shelbynet") && amount && Number(amount) > 0 && fromToken !== toToken) {
      return NextResponse.json({
        success: true,
        quote: {
          network,
          fromToken,
          toToken,
          amount,
          amountIn: amount,
          expectedOut: amount,
          minOut: amount,
          slippage: 0,
          curveType: "review",
          version: "review",
          executable: false,
          reviewMode: true,
          payload: null,
        },
      });
    }

    const quote = await buildLiquidswapQuote({
      network,
      fromToken,
      toToken,
      amount,
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
