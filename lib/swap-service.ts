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
  sol: "SOL",
  sui: "SUI",
  thl: "THL",
  cake: "CAKE",
  move: "MOVE",
};

const SWAP_KEYWORDS = ["swap", "swapi", "بدل", "bdel", "convert", "exchange"];
const IGNORED_WORDS = new Set([
  "swap",
  "swapi",
  "bdel",
  "convert",
  "exchange",
  "to",
  "for",
  "l",
  "ila",
  "men",
  "min",
  "from",
  "aptos",
]);

function normalizeToken(word: string): string {
  return TOKEN_ALIASES[word] ?? word.toUpperCase();
}

export function parseSwapIntent(prompt: string): SwapIntent | null {
  const normalized = prompt.toLowerCase().replace(/[,،]/g, " ");

  if (!SWAP_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return null;
  }

  const amount = normalized.match(/(\d+(?:\.\d+)?)/)?.[1] ?? "";
  const tokenWords = normalized.match(/[a-z][a-z0-9]{1,12}/g) ?? [];
  const tokens = tokenWords
    .filter((word) => !IGNORED_WORDS.has(word) || word === "aptos")
    .map(normalizeToken)
    .filter((word) => /^[A-Z0-9]{2,12}$/.test(word));

  const uniqueTokens = Array.from(new Set(tokens));
  const fromToken = uniqueTokens[0] ?? "";
  const toToken = uniqueTokens[1] ?? (fromToken === "APT" && amount ? "USDC" : "");

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
    return "Swap mode is ready. Choose the missing amount or token in the swap box below, then record it on Shelby. On-chain execution still needs a trusted Aptos DEX router.";
  }

  return [
    "Swap request recorded on Shelby.",
    `Request: ${intent.amount} ${intent.fromToken} -> ${intent.toToken}.`,
    "Status: ready for a DEX router step; no tokens were moved yet.",
  ].join("\n");
}
