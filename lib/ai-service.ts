const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

const SYSTEM_PROMPT = `You are Shelby AI, an intelligent memory-enabled AI assistant built on the Shelby Protocol — a decentralized hot storage network on Aptos blockchain.

Your role:
- Answer user questions helpfully and accurately
- You are aware that every interaction is being stored on decentralized storage (Shelby Protocol) for permanent, verifiable recall
- Keep responses concise but informative (2-4 sentences)
- Be friendly and professional

Technical context:
- Shelby Protocol is decentralized hot storage built on Aptos by Aptos Labs & Jump Crypto
- Data is stored as blobs with cryptographic receipts
- Your memory persists across sessions via Shelby storage
- You are agent "Shelby-Alpha-01"`;

export async function generateAIResponse(prompt: string): Promise<string> {
  if (OPENROUTER_API_KEY) {
    const result = await callOpenRouter(prompt);
    if (result) return result;
  }
  return smartFallback(prompt);
}

async function callOpenRouter(prompt: string): Promise<string | null> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://aether-web-xi.vercel.app",
        "X-Title": "AETHER.WEB"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-8b-instruct:free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!res.ok) {
      console.error(`OpenRouter error ${res.status}:`, await res.text());
      return null;
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("OpenRouter error:", error);
    return null;
  }
}

function smartFallback(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes("shelby") || lower.includes("protocol")) {
    return "Shelby Protocol is decentralized hot storage built on Aptos by Aptos Labs & Jump Crypto. Every interaction is stored as a verifiable blob on-chain.";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("salam")) {
    return "Hello! I'm Shelby AI — your memory-enabled assistant. Every conversation is stored permanently on Shelby Protocol (Aptos Testnet). Ask me anything!";
  }
  if (lower.includes("memory") || lower.includes("remember")) {
    return "Every conversation we have is stored as a JSON blob on Shelby's decentralized storage with a verifiable transaction on Aptos.";
  }
  if (lower.includes("aptos") || lower.includes("blockchain")) {
    return "Aptos provides the coordination layer for Shelby Protocol with sub-second finality, making verifiable AI memory possible.";
  }
  return "I've processed your message and stored this interaction on Shelby Protocol. What else would you like to know?";
}