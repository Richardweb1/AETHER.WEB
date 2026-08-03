import { SDK, convertDecimalToFixedString, convertValueToDecimal } from "@pontem/liquidswap-sdk";

type CurveType = "uncorrelated" | "stable";
type ContractVersion = 0 | 0.5;
export type DexNetwork = "aptos-testnet" | "aptos-mainnet" | "shelbynet";

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
  version: ContractVersion;
  payload: {
    type: "entry_function_payload";
    function: string;
    type_arguments: string[];
    arguments: string[];
  };
}

const TESTNET_NODE_URL = process.env.APTOS_TESTNET_NODE_URL || process.env.APTOS_NODE_URL || "https://fullnode.testnet.aptoslabs.com/v1";
const MAINNET_NODE_URL = process.env.APTOS_MAINNET_NODE_URL || "https://fullnode.mainnet.aptoslabs.com/v1";
const SHELBY_NODE_URL = process.env.SHELBYNET_NODE_URL || "https://api.shelbynet.shelby.xyz/v1";
const DEFAULT_SLIPPAGE = Number(process.env.DEX_SLIPPAGE || "0.005");
const TESTNET_LIQUIDSWAP_ACCOUNT =
  process.env.LIQUIDSWAP_TESTNET_ACCOUNT || "0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9";
const TESTNET_RESOURCE_ACCOUNT =
  process.env.LIQUIDSWAP_TESTNET_RESOURCE_ACCOUNT || "0x385068db10693e06512ed54b1e6e8f1fb9945bb7a78c28a45585939ce953f99e";
const SHELBY_LIQUIDSWAP_ACCOUNT = process.env.LIQUIDSWAP_SHELBYNET_ACCOUNT || "";
const SHELBY_RESOURCE_ACCOUNT = process.env.LIQUIDSWAP_SHELBYNET_RESOURCE_ACCOUNT || "";

const TOKEN_SETS: Record<DexNetwork, Record<string, DexToken>> = {
  "aptos-testnet": {
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
  },
  "aptos-mainnet": {
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
      type: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH",
      decimals: 8,
    },
    WBTC: {
      symbol: "WBTC",
      type: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WBTC",
      decimals: 8,
    },
  },
  shelbynet: {
    APT: {
      symbol: "APT",
      type: "0x1::aptos_coin::AptosCoin",
      decimals: 8,
    },
    USDC: {
      symbol: "USDC",
      type: process.env.SHELBYNET_USDC_TYPE || "",
      decimals: 6,
    },
    USDT: {
      symbol: "USDT",
      type: process.env.SHELBYNET_USDT_TYPE || "",
      decimals: 6,
    },
  },
};

const STABLE_PAIRS = new Set(["USDC-USDT", "USDT-USDC"]);
const MAINNET_V05_PAIRS = new Set(["USDC-USDT", "USDT-USDC"]);

function getNetworkConfig(network: DexNetwork) {
  if (network === "aptos-mainnet") {
    return {
      nodeUrl: MAINNET_NODE_URL,
      moduleAccount: "",
      resourceAccount: "",
      useDefaultNetworkOptions: true,
    };
  }

  if (network === "shelbynet") {
    if (!SHELBY_LIQUIDSWAP_ACCOUNT || !SHELBY_RESOURCE_ACCOUNT) {
      throw new Error("ShelbyNet swap is ready in the UI, but no ShelbyNet DEX router is configured yet. Deploy Liquidswap-compatible contracts on ShelbyNet, then set LIQUIDSWAP_SHELBYNET_ACCOUNT and LIQUIDSWAP_SHELBYNET_RESOURCE_ACCOUNT.");
    }

    return {
      nodeUrl: SHELBY_NODE_URL,
      moduleAccount: SHELBY_LIQUIDSWAP_ACCOUNT,
      resourceAccount: SHELBY_RESOURCE_ACCOUNT,
      useDefaultNetworkOptions: false,
    };
  }

  return {
    nodeUrl: TESTNET_NODE_URL,
    moduleAccount: TESTNET_LIQUIDSWAP_ACCOUNT,
    resourceAccount: TESTNET_RESOURCE_ACCOUNT,
    useDefaultNetworkOptions: false,
  };
}

function getSdk(network: DexNetwork, nativeToken: string) {
  const config = getNetworkConfig(network);

  if (config.useDefaultNetworkOptions) {
    return new SDK({ nodeUrl: config.nodeUrl });
  }

  return new SDK({
    nodeUrl: config.nodeUrl,
    networkOptions: {
      nativeToken,
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

function getContractVersion(network: DexNetwork, fromToken: string, toToken: string): ContractVersion {
  if (network === "aptos-mainnet" && MAINNET_V05_PAIRS.has(`${fromToken}-${toToken}`)) {
    return 0.5;
  }

  return 0;
}

function toDisplayAmount(amount: string, decimals: number): string {
  return convertDecimalToFixedString(convertValueToDecimal(amount, 0), decimals);
}

export function getSupportedDexTokens(network: DexNetwork = "aptos-testnet"): DexToken[] {
  return Object.values(TOKEN_SETS[network]).filter((token) => token.type);
}

export async function buildLiquidswapQuote(params: {
  network?: DexNetwork;
  fromToken: string;
  toToken: string;
  amount: string;
  slippage?: number;
}): Promise<SwapQuote> {
  const network = params.network ?? "aptos-testnet";
  const tokens = TOKEN_SETS[network];
  const from = tokens[params.fromToken.toUpperCase()];
  const to = tokens[params.toToken.toUpperCase()];
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

  const sdk = getSdk(network, tokens.APT.type);
  const curveType = getCurveType(from.symbol, to.symbol);
  const version = getContractVersion(network, from.symbol, to.symbol);
  const amountIn = convertValueToDecimal(params.amount, from.decimals).toNumber();
  const expectedOutRaw = await sdk.Swap.calculateRates({
    fromToken: from.type,
    toToken: to.type,
    amount: amountIn,
    interactiveToken: "from",
    curveType,
    version,
  });

  if (Number(expectedOutRaw) <= 0) {
    throw new Error("This quote returned zero output. Try a larger amount or another pair.");
  }

  const payload = sdk.Swap.createSwapTransactionPayload({
    fromToken: from.type,
    toToken: to.type,
    fromAmount: amountIn,
    toAmount: Number(expectedOutRaw),
    interactiveToken: "from",
    slippage,
    stableSwapType: curveType === "stable" ? "high" : "normal",
    curveType,
    version,
  });

  const minOutRaw = payload.arguments[1] ?? expectedOutRaw;

  if (Number(minOutRaw) <= 0) {
    throw new Error("This quote is too small after slippage. Try a larger amount or another pair.");
  }

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
    version,
    payload,
  };
}
