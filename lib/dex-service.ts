import { SDK, convertDecimalToFixedString, convertValueToDecimal } from "@pontem/liquidswap-sdk";

type CurveType = "uncorrelated" | "stable";
export type DexNetwork = "aptos-testnet" | "shelbynet";

export interface DexToken {
  symbol: string;
  type: string;
  decimals: number;
}

export interface SwapQuote {
  network: DexNetwork;
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
const SHELBY_NODE_URL = process.env.SHELBYNET_NODE_URL || "https://api.shelbynet.shelby.xyz/v1";
const DEFAULT_SLIPPAGE = Number(process.env.DEX_SLIPPAGE || "0.005");
const TESTNET_LIQUIDSWAP_ACCOUNT =
  process.env.LIQUIDSWAP_TESTNET_ACCOUNT || "0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9";
const TESTNET_RESOURCE_ACCOUNT =
  process.env.LIQUIDSWAP_TESTNET_RESOURCE_ACCOUNT || "0x385068db10693e06512ed54b1e6e8f1fb9945bb7a78c28a45585939ce953f99e";
const SHELBY_LIQUIDSWAP_ACCOUNT = process.env.LIQUIDSWAP_SHELBYNET_ACCOUNT || "";
const SHELBY_RESOURCE_ACCOUNT = process.env.LIQUIDSWAP_SHELBYNET_RESOURCE_ACCOUNT || "";

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

function getNetworkConfig(network: DexNetwork) {
  if (network === "shelbynet") {
    if (!SHELBY_LIQUIDSWAP_ACCOUNT || !SHELBY_RESOURCE_ACCOUNT) {
      throw new Error("ShelbyNet swap is ready in the UI, but no ShelbyNet DEX router is configured yet. Deploy Liquidswap-compatible contracts on ShelbyNet, then set LIQUIDSWAP_SHELBYNET_ACCOUNT and LIQUIDSWAP_SHELBYNET_RESOURCE_ACCOUNT.");
    }

    return {
      nodeUrl: SHELBY_NODE_URL,
      moduleAccount: SHELBY_LIQUIDSWAP_ACCOUNT,
      resourceAccount: SHELBY_RESOURCE_ACCOUNT,
    };
  }

  return {
    nodeUrl: NODE_URL,
    moduleAccount: TESTNET_LIQUIDSWAP_ACCOUNT,
    resourceAccount: TESTNET_RESOURCE_ACCOUNT,
  };
}

function getSdk(network: DexNetwork) {
  const config = getNetworkConfig(network);

  return new SDK({
    nodeUrl: config.nodeUrl,
    networkOptions: {
      nativeToken: DEX_TOKENS.APT.type,
      modules: {
        Scripts: `${config.moduleAccount}::scripts_v2`,
        CoinInfo: "0x1::coin::CoinInfo",
        CoinStore: "0x1::coin::CoinStore",
      },
      resourceAccount: config.resourceAccount,
      moduleAccount: config.moduleAccount,
      resourceAccountV05: config.resourceAccount,
      moduleAccountV05: config.moduleAccount,
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
  network?: DexNetwork;
  fromToken: string;
  toToken: string;
  amount: string;
  slippage?: number;
}): Promise<SwapQuote> {
  const network = params.network ?? "aptos-testnet";
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

  const sdk = getSdk(network);
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
    network,
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
