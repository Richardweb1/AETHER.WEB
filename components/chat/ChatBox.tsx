"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  AlertCircle,
  CheckCircle,
  Cpu,
  ExternalLink,
  Loader2,
  Send,
  WalletCards,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { parseTransferIntent, TransferIntent } from "@/lib/transfer-intent";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  status?: "thinking" | "storing" | "stored" | "error" | "action";
  blobName?: string;
  explorerUrl?: string;
  transferIntent?: TransferIntent;
  actionPrompt?: string;
}

interface PendingTransfer {
  token: "APT";
  amount?: string;
  recipient?: string;
  prompt: string;
}

const APT_DECIMALS = 100_000_000;

function extractAmount(input: string) {
  return input.match(/\b([0-9]+(?:\.[0-9]{1,8})?)\s*(?:apt)?\b/i)?.[1];
}

function extractRecipient(input: string) {
  return input.match(/\b(0x[a-fA-F0-9]{16,})\b/)?.[1];
}

function toOctas(amount: string) {
  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(8, "0").slice(0, 8);
  return (
    BigInt(whole) * BigInt(APT_DECIMALS) +
    BigInt(paddedFraction || "0")
  ).toString();
}

function buildTransferIntentFromParts(
  amount: string,
  recipient: string
): TransferIntent {
  return {
    action: "token_transfer",
    token: "APT",
    amount,
    amountOctas: toOctas(amount),
    recipient,
  };
}

export default function ChatBox({ wallet }: { wallet: string }) {
  const { signAndSubmitTransaction } = useWallet();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const replaceLatestPending = (message: ChatMessage) => {
    setMessages((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex(
        (m) =>
          m.status === "thinking" ||
          m.status === "storing" ||
          m.status === "action"
      );
      if (idx !== -1) updated[idx] = message;
      return updated;
    });
  };

  const saveTransferMemory = async (
    promptText: string,
    intent: TransferIntent,
    txHash: string
  ) => {
    const res = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet_address: wallet,
        prompt: promptText,
        memory_type: "token_transfer",
        transfer: intent,
        tx_hash: txHash,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  };

  const handleConfirmTransfer = async (
    promptText: string,
    intent: TransferIntent
  ) => {
    if (isLoading) return;
    setIsLoading(true);
    replaceLatestPending({
      role: "assistant",
      content: "Waiting for wallet confirmation...",
      status: "storing",
      transferIntent: intent,
    });

    try {
      const submitted = await signAndSubmitTransaction({
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [intent.recipient, intent.amountOctas],
        },
      });

      const txHash = submitted.hash;
      const data = await saveTransferMemory(promptText, intent, txHash);

      replaceLatestPending({
        role: "assistant",
        content: `Transfer sent: ${intent.amount} ${intent.token} to ${intent.recipient}. The action was saved to Shelby memory.`,
        status: data.stored_on_shelby ? "stored" : "error",
        blobName: data.blobName,
        explorerUrl: data.explorerUrl,
      });
    } catch (error) {
      replaceLatestPending({
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "Transfer was not completed. You can retry the wallet confirmation.",
        status: "action",
        transferIntent: intent,
        actionPrompt: promptText,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!wallet) {
      alert("Please connect your Petra wallet first!");
      return;
    }

    const promptText = input.trim();
    const transferIntent = parseTransferIntent(promptText);
    const amountFromText = extractAmount(promptText);
    const recipientFromText = extractRecipient(promptText);
    const isAskingAboutAptTransfer =
      /\b(can|could|how|want|bghit|baghi|wach|n9dar|nkdr|ndir)\b/i.test(promptText) &&
      /\b(send|transfer|pay|sift|nsift)\b/i.test(promptText) &&
      /\bapt\b/i.test(promptText);
    const isStartingTransfer =
      /\b(send|transfer|pay|sift|nsift|nseft|bghit\s+nsift|baghi\s+nsift)\b/i.test(promptText) &&
      (/\bapt\b/i.test(promptText) || !!pendingTransfer);

    setMessages((prev) => [...prev, { role: "user", content: promptText }]);
    setInput("");

    if (pendingTransfer) {
      const nextTransfer = {
        ...pendingTransfer,
        amount: pendingTransfer.amount || amountFromText,
        recipient: pendingTransfer.recipient || recipientFromText,
        prompt: `${pendingTransfer.prompt}\n${promptText}`,
      };

      if (nextTransfer.amount && nextTransfer.recipient) {
        const intent = buildTransferIntentFromParts(
          nextTransfer.amount,
          nextTransfer.recipient
        );
        setPendingTransfer(null);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Great, I have everything needed. Review this transfer before signing in Petra.",
            status: "action",
            transferIntent: intent,
            actionPrompt: nextTransfer.prompt,
          },
        ]);
        return;
      }

      setPendingTransfer(nextTransfer);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: !nextTransfer.amount
            ? "How much APT do you want to send?"
            : "Send it to which Aptos address? Paste the 0x recipient address.",
        },
      ]);
      return;
    }

    if (!transferIntent && isAskingAboutAptTransfer) {
      setPendingTransfer({
        token: "APT",
        amount: amountFromText,
        recipient: recipientFromText,
        prompt: promptText,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            amountFromText
              ? "Yes. Send it to which Aptos address? Paste the 0x recipient address."
              : "Yes. How much APT do you want to send, and to which 0x address?",
        },
      ]);
      return;
    }

    if (!transferIntent && isStartingTransfer) {
      const nextTransfer: PendingTransfer = {
        token: "APT",
        amount: amountFromText,
        recipient: recipientFromText,
        prompt: promptText,
      };

      if (nextTransfer.amount && nextTransfer.recipient) {
        const intent = buildTransferIntentFromParts(
          nextTransfer.amount,
          nextTransfer.recipient
        );
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I found a token transfer request. Review it before signing in Petra.",
            status: "action",
            transferIntent: intent,
            actionPrompt: promptText,
          },
        ]);
        return;
      }

      setPendingTransfer(nextTransfer);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: !nextTransfer.amount
            ? "Sure. How much APT do you want to send?"
            : "Sure. Send it to which Aptos address? Paste the 0x recipient address.",
        },
      ]);
      return;
    }

    if (transferIntent) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I found a token transfer request. Review it before signing in Petra.",
          status: "action",
          transferIntent,
          actionPrompt: promptText,
        },
      ]);
      return;
    }

    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", status: "thinking" },
    ]);

    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: wallet, prompt: promptText }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      replaceLatestPending({
        role: "assistant",
        content: data.aiResponse,
        status: "storing",
      });

      await new Promise((r) => setTimeout(r, 1000));

      replaceLatestPending({
        role: "assistant",
        content: data.aiResponse,
        status: data.stored_on_shelby ? "stored" : "error",
        blobName: data.blobName,
        explorerUrl: data.explorerUrl,
      });
    } catch (error) {
      replaceLatestPending({
        role: "assistant",
        content:
          error instanceof Error ? error.message : "Something went wrong.",
        status: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden min-h-[500px]">
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <Cpu className="w-12 h-12 opacity-20" />
            <p className="text-center">
              {wallet
                ? "Ask anything, or try: send 0.1 APT to 0x..."
                : "Connect your Petra wallet to start chatting."}
            </p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((m, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx}
              className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={
                  "max-w-[80%] p-4 rounded-2xl " +
                  (m.role === "user"
                    ? "bg-violet-600 text-white rounded-br-none"
                    : "bg-white/5 border border-white/10 rounded-bl-none")
                }
              >
                {m.status === "thinking" ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : m.status === "storing" ? (
                  <div className="space-y-2">
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    <div className="flex items-center gap-2 text-xs text-violet-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                )}

                {m.status === "action" && m.transferIntent && (
                  <div className="mt-4 rounded-xl border border-violet-400/30 bg-violet-500/10 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-violet-200">
                      <WalletCards className="w-4 h-4" />
                      Transfer Preview
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span className="text-slate-400">Token</span>
                      <span>{m.transferIntent.token}</span>
                      <span className="text-slate-400">Amount</span>
                      <span>{m.transferIntent.amount}</span>
                      <span className="text-slate-400">Recipient</span>
                      <span className="break-all font-mono">
                        {m.transferIntent.recipient}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleConfirmTransfer(
                          m.actionPrompt || m.content,
                          m.transferIntent!
                        )
                      }
                      disabled={isLoading}
                      className="w-full rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
                    >
                      Confirm in Petra
                    </button>
                  </div>
                )}

                {m.status === "stored" && m.blobName && (
                  <div className="mt-3 pt-2 border-t border-white/10 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-emerald-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Stored on Shelby
                      </span>
                      {m.explorerUrl && (
                        <a
                          href={m.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:underline"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono truncate">
                      {m.blobName}
                    </div>
                  </div>
                )}

                {m.status === "error" && (
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2 text-[10px] text-red-400">
                    <AlertCircle className="w-3 h-3" /> {m.content || "Action failed"}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white/5 border-t border-white/10">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              wallet
                ? "Ask Shelby AI, or say: send 0.1 APT to 0x..."
                : "Connect wallet first..."
            }
            disabled={isLoading || !wallet}
            className="flex-1 bg-transparent border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !wallet}
            className="p-3 bg-violet-600 rounded-xl hover:bg-violet-500 transition disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
