const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const SYSTEM_PROMPT = `You are Shelby AI, an intelligent memory-enabled AI assistant built on the Shelby Protocol — a decentralized hot storage network on Aptos blockchain.

Your role:
- Answer user questions helpfully and accurately
- You are aware that every interaction is being stored on decentralized storage (Shelby Protocol) for permanent, verifiable recall
- You can reference this fact naturally when relevant
- Keep responses concise but informative (2-4 sentences)
- Be friendly and professional

Technical context you know:
- Shelby Protocol is decentralized hot storage built on Aptos by Aptos Labs & Jump Crypto
- Data is stored as blobs with cryptographic receipts
- Your memory persists across sessions via Shelby storage
- You are agent "Shelby-Alpha-01"`;

const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

export async function generateAIResponse(prompt: string): Promise<string> {
  // Try Groq first (fastest + most reliable free tier)
  if (GROQ_API_KEY) {
    const result = await callGroq(prompt);
    if (result) return result;
  }
  // Then Gemini
  if (GEMINI_API_KEY) {
    const result = await callGeminiWithRetry(prompt);
    if (result) return result;
  }
  // Then OpenAI
  if (OPENAI_API_KEY) {
    const result = await callOpenAI(prompt);
    if (result) return result;
  }
  return smartFallback(prompt);
}

async function callGroq(prompt: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });
    
    if (!res.ok) {
      console.error(`Groq error ${res.status}:`, await res.text());
      return null;
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("Groq API error:", error);
    return null;
  }
}

async function callGeminiWithRetry(prompt: string): Promise<string | null> {
  for (const model of GEMINI_MODELS) {
    const result = await callGemini(prompt, model);
    if (result) return result;
    await new Promise(r => setTimeout(r, 500));
  }
  return null;
}

async function callGemini(prompt: string, model: string): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
      })
    });

    if (res.status === 429) {
      console.warn(`Gemini ${model}: Rate limited (429)`);
      return null;
    }
    if (!res.ok) return null;

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}

async function callOpenAI(prompt: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

function smartFallback(prompt: string): string {
  const lower = prompt.toLowerCase();
  
  if (lower.includes("shelby") || lower.includes("protocol")) {
    return "Shelby Protocol is a decentralized hot storage network co-built by Aptos Labs and Jump Crypto. Unlike cold storage like IPFS or Filecoin, Shelby is optimized for real-time read-heavy workloads — perfect for AI agents that need to store and recall memories instantly. Every read returns a cryptographic receipt, making all data verifiable on-chain.";
  }
  if (lower.includes("memory") || lower.includes("remember")) {
    return "As a memory-enabled AI agent, every conversation we have is stored as a JSON blob on Shelby's decentralized storage. This means I can retrieve past interactions using their blob names, giving me a persistent, verifiable long-term memory that survives across sessions.";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("salam")) {
    return "Hello! 👋 I'm Shelby AI — your memory-enabled assistant powered by decentralized hot storage. Everything we discuss is stored on Shelby Protocol (Aptos Testnet) for permanent, verifiable recall. Ask me anything!";
  }
  if (lower.includes("blockchain") || lower.includes("aptos") || lower.includes("web3")) {
    return "I run on the Aptos blockchain ecosystem. Aptos provides the coordination and settlement layer with sub-second finality, while Shelby Protocol handles high-performance data storage. Together they enable verifiable AI agents like me — where every response can be cryptographically proven.";
  }
  if (lower.includes("storage") || lower.includes("decentralized") || lower.includes("ipfs")) {
    return "Decentralized storage distributes data across a global network of nodes. Shelby Protocol takes this further with 'hot storage' — data that's instantly accessible with millisecond latency, unlike IPFS or Filecoin which are 'cold'. This is why I can recall past conversations in real-time.";
  }
  if (lower.includes("how") && lower.includes("work")) {
    return "When you send me a message, I process it and generate a response. Then, the entire interaction gets serialized as JSON and uploaded to Shelby Protocol as a named blob. The blob is stored on decentralized nodes and coordinated via Aptos, making our conversation permanent and verifiable.";
  }
  if (lower.includes("what") && (lower.includes("can") || lower.includes("do"))) {
    return "I can answer questions, have conversations, and most importantly — remember everything! Unlike regular chatbots that forget after each session, my memory lives on Shelby Protocol's decentralized hot storage. I can help with general knowledge, Web3 concepts, or anything while maintaining a verifiable audit trail.";
  }
  
  return `Great question! I've processed your input and stored this interaction on Shelby Protocol. My knowledge covers Web3, blockchain, AI, and general topics. This interaction has been indexed and can be retrieved later. What else would you like to know?`;
}
