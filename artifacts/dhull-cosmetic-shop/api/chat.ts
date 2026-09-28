import { shopData } from "../src/config/shop-data.js";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const MODEL = "llama-3.3-70b-versatile";
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const requestLog = new Map<string, number[]>();

const systemPrompt = `You are the warm, helpful AI beauty concierge for ${shopData.name}, a local cosmetic shop in ${shopData.location}.
Shop timing: ${shopData.timing}.
Your tagline is "${shopData.tagline}".
Answer in the same language as the customer's latest message. Support English, Hindi, and Hinglish naturally. Keep responses friendly, concise, and useful. Help with product categories, prices, skincare tips, offers, shop timing, and ordering. Do not invent exact product stock, prices, offers, or contact details that are not provided; say the customer can confirm on WhatsApp or in-store instead. For skincare advice, give gentle general guidance and recommend consulting a dermatologist for persistent, painful, or serious concerns. Never claim to be a doctor.`;

function parseMessages(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== "object" || !("messages" in body)) return null;
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 10) {
    return null;
  }
  const valid = messages.every(
    (message): message is ChatMessage =>
      Boolean(message) &&
      typeof message === "object" &&
      typeof (message as { role?: unknown }).role === "string" &&
      ["user", "assistant"].includes(
        String((message as { role?: unknown }).role),
      ) &&
      typeof (message as { content?: unknown }).content === "string" &&
      (message as { content: string }).content.trim().length > 0 &&
      (message as { content: string }).content.length <= 4000,
  );
  return valid ? messages : null;
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    requestLog.set(key, recent);
    return true;
  }
  recent.push(now);
  requestLog.set(key, recent);
  return false;
}

function writeJson(res: any, status: number, body: unknown) {
  res.status(status).json(body);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    writeJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const messages = parseMessages(req.body);
  if (!messages) {
    writeJson(res, 400, { error: "Please send up to 10 valid chat messages." });
    return;
  }

  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded || "unknown";
  if (rateLimited(String(ip).split(",")[0].trim())) {
    writeJson(res, 429, {
      error: "Too many messages. Please try again in a minute.",
    });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    writeJson(res, 500, { error: "Chat service is not configured yet." });
    return;
  }

  const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      temperature: 0.65,
      max_tokens: 500,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    writeJson(res, upstream.status === 429 ? 429 : 502, {
      error:
        upstream.status === 429
          ? "The chat service is busy. Please try again shortly."
          : "I couldn't reach the beauty assistant right now. Please try again.",
    });
    return;
  }

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const content = json.choices?.[0]?.delta?.content;
          if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
        } catch {
          // Ignore an incomplete frame at a transport boundary.
        }
      }
    }
    res.write("data: [DONE]\n\n");
  } finally {
    reader.releaseLock();
    res.end();
  }
}