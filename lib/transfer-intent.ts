export interface TransferIntent {
  action: "token_transfer";
  token: "APT";
  amount: string;
  amountOctas: string;
  recipient: string;
}

const APT_DECIMALS = 100_000_000;

function normalizeAddress(address: string) {
  return address.startsWith("0x") ? address : `0x${address}`;
}

export function parseTransferIntent(input: string): TransferIntent | null {
  const match = input.match(
    /\b(?:send|transfer|pay)\s+([0-9]+(?:\.[0-9]{1,8})?)\s+(apt)\s+(?:to\s+)?(0x[a-fA-F0-9]{16,})\b/i
  );

  if (!match) return null;

  const amount = match[1];
  const recipient = normalizeAddress(match[3]);
  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(8, "0").slice(0, 8);
  const amountOctas =
    BigInt(whole) * BigInt(APT_DECIMALS) + BigInt(paddedFraction || "0");

  if (amountOctas <= BigInt(0)) return null;

  return {
    action: "token_transfer",
    token: "APT",
    amount,
    amountOctas: amountOctas.toString(),
    recipient,
  };
}
