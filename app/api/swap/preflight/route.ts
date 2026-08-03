import { NextResponse } from "next/server";
import { DexNetwork, getDexNodeUrl, getDexToken } from "@/lib/dex-service";

function coinStoreType(coinType: string) {
  return `0x1::coin::CoinStore<${coinType}>`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const network = String(body.network || "aptos-testnet") as DexNetwork;
    const wallet = String(body.wallet_address || "");
    const toToken = getDexToken(network, String(body.toToken || ""));

    if (!wallet) throw new Error("Connect wallet first.");
    if (!toToken?.type) throw new Error("Receive token is not supported on this network.");

    if (network === "aptos-mainnet") {
      return NextResponse.json({ success: true, needsRegistration: false });
    }

    if (toToken.type === "0x1::aptos_coin::AptosCoin") {
      return NextResponse.json({ success: true, needsRegistration: false });
    }

    const resourceUrl = `${getDexNodeUrl(network)}/accounts/${wallet}/resource/${encodeURIComponent(coinStoreType(toToken.type))}`;
    const resourceRes = await fetch(resourceUrl, { cache: "no-store" });

    if (resourceRes.ok) {
      return NextResponse.json({ success: true, needsRegistration: false });
    }

    if (resourceRes.status !== 404) {
      const text = await resourceRes.text();
      throw new Error(text || "Could not check receive token registration.");
    }

    return NextResponse.json({
      success: true,
      needsRegistration: true,
      token: toToken.symbol,
      payload: {
        function: "0x1::managed_coin::register",
        typeArguments: [toToken.type],
        functionArguments: [],
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Swap preflight failed." },
      { status: 400 }
    );
  }
}
