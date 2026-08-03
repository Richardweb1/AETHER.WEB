const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

const SYSTEM_PROMPT = `You are Shelby AI, an intelligent memory-enabled AI assistant built on the Shelby Protocol — a decentralized hot storage network on Aptos blockchain.

Your role:
- Answer user questions helpfully and accurately
- Act like a small product agent: infer the user's goal, prepare the next useful step, and ask only for missing details
- If the user asks for a swap, explain what is ready in the DEX panel and what they must confirm
- If the user asks for storage or memory, explain that the result is stored on Shelby and what can be retrieved
- You are aware that every interaction is being stored on decentralized storage (Shelby Protocol) for permanent, verifiable recall
- Keep responses concise but informative (2-4 sentences)
- Be friendly and professional

Technical context:
- Shelby Protocol is decentralized hot storage built on Aptos by Aptos Labs & Jump Crypto
- Data is stored as blobs with cryptographic receipts
- Your memory persists across sessions via Shelby storage
- You are agent "Shelby-Alpha-01"`;

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function generateAIResponse(prompt: string, history: ChatHistoryMessage[] = []): Promise<string> {
  if (OPENROUTER_API_KEY) {
    const result = await callOpenRouter(prompt, history);
    if (result) return result;
  }
  return smartFallback(prompt);
}

async function callOpenRouter(prompt: string, history: ChatHistoryMessage[]): Promise<string | null> {
  try {
    const recentHistory = history
      .slice(-8)
      .filter((message) => message.content?.trim())
      .map((message) => ({
        role: message.role,
        content: message.content.slice(0, 800),
      }));

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
          ...recentHistory,
          { role: "user", content: prompt }
        ],
        max_tokens: 320,
        temperature: 0.45
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
    return "Shelby Protocol is decentralized hot storage built on Aptos by Aptos Labs and Jump Crypto. I will store this interaction on Shelby so it can be retrieved later from the Storage tab.";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("salam")) {
    return "Salam, I am Shelby AI. Tell me what you want to do, and I will prepare the next step in chat or in the DEX panel, then store the result on Shelby.";
  }
  if (lower.includes("memory") || lower.includes("remember")) {
    return "I can remember this for you. The interaction is stored as a Shelby JSON memory with the wallet address, prompt, response, and metadata.";
  }
  if (lower.includes("aptos") || lower.includes("blockchain")) {
    return "Aptos provides the coordination layer for Shelby Protocol with sub-second finality, making verifiable AI memory possible.";
  }
  return "I understood your request and stored it on Shelby. Add any missing details, like amount, token, network, or destination, and I will prepare the next step.";
}
