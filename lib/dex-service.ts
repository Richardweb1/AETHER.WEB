import { SDK, convertDecimalToFixedString, convertValueToDecimal } from "@pontem/liquidswap-sdk";

type CurveType = "uncorrelated" | "stable";

export interface DexToken {
  symbol: string;
  type: string;
  decimals: number;
}

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  amount: string;
  amountIn: string;
  expectedOut: string;
  minOut: string;
  slippage: number;
  curveType: CurveType;
  payload: {
    type: "entry_function_payload";
    function: string;
    type_arguments: string[];
    arguments: string[];
  };
}

const NODE_URL = process.env.APTOS_NODE_URL || "https://fullnode.mainnet.aptoslabs.com/v1";
const DEFAULT_SLIPPAGE = Number(process.env.DEX_SLIPPAGE || "0.005");

export const DEX_TOKENS: Record<string, DexToken> = {
  APT: {
    symbol: "APT",
    type: "0x1::aptos_coin::AptosCoin",
    decimals: 8,
  },
  USDC: {
    symbol: "USDC",
    type: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
    decimals: 6,
  },
  USDT: {
    symbol: "USDT",
    type: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
    decimals: 6,
  },
  WETH: {
    symbol: "WETH",
    type: "0xcc8a89c8dce9693d354449f1f73e60e14e347417854f029db5bc8e7454008abb::coin::T",
    decimals: 8,
  },
  WBTC: {
    symbol: "WBTC",
    type: "0x5e156f1207d0ebfa19a9eeff00d62a14a208c8f0d2a8f8d65077490e897a5b8d::coin::T",
    decimals: 8,
  },
};

const STABLE_PAIRS = new Set(["USDC-USDT", "USDT-USDC"]);

function getSdk() {
  return new SDK({ nodeUrl: NODE_URL });
}

function getCurveType(fromToken: string, toToken: string): CurveType {
  return STABLE_PAIRS.has(`${fromToken}-${toToken}`) ? "stable" : "uncorrelated";
}

function toDisplayAmount(amount: string, decimals: number): string {
  return convertDecimalToFixedString(convertValueToDecimal(amount, 0), decimals);
}

export function getSupportedDexTokens(): DexToken[] {
  return Object.values(DEX_TOKENS);
}

export async function buildLiquidswapQuote(params: {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage?: number;
}): Promise<SwapQuote> {
  const from = DEX_TOKENS[params.fromToken.toUpperCase()];
  const to = DEX_TOKENS[params.toToken.toUpperCase()];
  const slippage = params.slippage ?? DEFAULT_SLIPPAGE;

  if (!from || !to) {
    throw new Error("This token is not supported by the current Liquidswap integration.");
  }

  if (from.symbol === to.symbol) {
    throw new Error("Choose two different tokens.");
  }

  if (!params.amount || Number(params.amount) <= 0) {
    throw new Error("Enter a valid amount.");
  }

  const sdk = getSdk();
  const curveType = getCurveType(from.symbol, to.symbol);
  const amountIn = convertValueToDecimal(params.amount, from.decimals).toNumber();
  const expectedOutRaw = await sdk.Swap.calculateRates({
    fromToken: from.type,
    toToken: to.type,
    amount: amountIn,
    interactiveToken: "from",
    curveType,
    version: 0,
  });

  const payload = sdk.Swap.createSwapTransactionPayload({
    fromToken: from.type,
    toToken: to.type,
    fromAmount: amountIn,
    toAmount: Number(expectedOutRaw),
    interactiveToken: "from",
    slippage,
    stableSwapType: curveType === "stable" ? "high" : "normal",
    curveType,
    version: 0,
  });

  const minOutRaw = payload.arguments[1] ?? expectedOutRaw;

  return {
    fromToken: from.symbol,
    toToken: to.symbol,
    amount: params.amount,
    amountIn: amountIn.toString(),
    expectedOut: toDisplayAmount(expectedOutRaw, to.decimals),
    minOut: toDisplayAmount(minOutRaw, to.decimals),
    slippage,
    curveType,
    payload,
  };
}
