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

const NODE_URL = process.env.APTOS_NODE_URL || "https://fullnode.testnet.aptoslabs.com/v1";
export const DEX_NETWORK = "aptos-testnet";
const DEFAULT_SLIPPAGE = Number(process.env.DEX_SLIPPAGE || "0.005");
const TESTNET_LIQUIDSWAP_ACCOUNT =
  process.env.LIQUIDSWAP_TESTNET_ACCOUNT || "0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9";
const TESTNET_RESOURCE_ACCOUNT =
  process.env.LIQUIDSWAP_TESTNET_RESOURCE_ACCOUNT || "0x385068db10693e06512ed54b1e6e8f1fb9945bb7a78c28a45585939ce953f99e";

export const DEX_TOKENS: Record<string, DexToken> = {
  APT: {
    symbol: "APT",
    type: "0x1::aptos_coin::AptosCoin",
    decimals: 8,
  },
  USDC: {
    symbol: "USDC",
    type: "0xb4d7b2466d211c1f4629e8340bb1a9e75e7f8fb38cc145c54c5c9f9d5017a318::coins_extended::USDC",
    decimals: 6,
  },
  USDT: {
    symbol: "USDT",
    type: `${TESTNET_LIQUIDSWAP_ACCOUNT}::coins::USDT`,
    decimals: 6,
  },
};

const STABLE_PAIRS = new Set(["USDC-USDT", "USDT-USDC"]);

function getSdk() {
  return new SDK({
    nodeUrl: NODE_URL,
    networkOptions: {
      nativeToken: DEX_TOKENS.APT.type,
      modules: {
        Scripts: `${TESTNET_LIQUIDSWAP_ACCOUNT}::scripts_v2`,
        CoinInfo: "0x1::coin::CoinInfo",
        CoinStore: "0x1::coin::CoinStore",
      },
      resourceAccount: TESTNET_RESOURCE_ACCOUNT,
      moduleAccount: TESTNET_LIQUIDSWAP_ACCOUNT,
      resourceAccountV05: TESTNET_RESOURCE_ACCOUNT,
      moduleAccountV05: TESTNET_LIQUIDSWAP_ACCOUNT,
    },
  });
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
