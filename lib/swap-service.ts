export interface SwapIntent {
  type: "swap_intent";
  fromToken: string;
  toToken: string;
  amount: string;
  status: "recorded" | "needs_confirmation";
  executionMode: "record_only";
  requestedAt: number;
}

const TOKEN_ALIASES: Record<string, string> = {
  apt: "APT",
  aptos: "APT",
  usdc: "USDC",
  usdt: "USDT",
  weth: "WETH",
  eth: "ETH",
  btc: "BTC",
  wbtc: "WBTC",
};

const SWAP_KEYWORDS = ["swap", "swapi", "بدل", "bdel", "convert", "exchange"];

export function parseSwapIntent(prompt: string): SwapIntent | null {
  const normalized = prompt.toLowerCase().replace(/[,،]/g, " ");

  if (!SWAP_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return null;
  }

  const amount = normalized.match(/(\d+(?:\.\d+)?)/)?.[1] ?? "";
  const tokenWords = normalized.match(/[a-z][a-z0-9]{1,12}/g) ?? [];
  const tokens = tokenWords
    .map((word) => TOKEN_ALIASES[word] ?? word.toUpperCase())
    .filter((word) => Object.values(TOKEN_ALIASES).includes(word));

  const uniqueTokens = Array.from(new Set(tokens));
  const fromToken = uniqueTokens[0] ?? "";
  const toToken = uniqueTokens[1] ?? "";

  return {
    type: "swap_intent",
    fromToken,
    toToken,
    amount,
    status: amount && fromToken && toToken ? "recorded" : "needs_confirmation",
    executionMode: "record_only",
    requestedAt: Date.now(),
  };
}

export function buildSwapResponse(intent: SwapIntent): string {
  if (intent.status === "needs_confirmation") {
    return "I can record your swap on Shelby, but I need the full trade details first. Try: `swapi 10 APT to USDC`. On-chain execution is disabled until a trusted Aptos DEX router is configured.";
  }

  return [
    "Swap intent recorded on Shelby.",
    `Request: ${intent.amount} ${intent.fromToken} -> ${intent.toToken}.`,
    "Status: recorded for audit/memory only; no tokens were moved yet.",
    "Next step: connect a real Aptos DEX router/API to execute after wallet confirmation.",
  ].join("\n");
}
