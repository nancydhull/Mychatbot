import type { Response } from "express";
import { logger } from "./logger";
import { shopData } from "./shop-data";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// Groq retired llama-3.3-70b-versatile on 2026-08-16.
// GPT-OSS 120B is their recommended production replacement.
const MODEL = "openai/gpt-oss-120b";
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const requestLog = new Map<string, number[]>();

const systemPrompt = `You are the warm, helpful AI beauty concierge for ${shopData.name}, a local cosmetic shop in ${shopData.location}.
Shop timing: ${shopData.timing}.
Your tagline is "${shopData.tagline}".

Answer in the same language as the customer's latest message. Support English, Hindi, and Hinglish naturally. Keep responses friendly, concise, and useful. Do not use emojis. Help with product categories, prices, skincare tips, offers, shop timing, and ordering. Do not invent exact product stock, prices, offers, or contact details that are not provided; say the customer can confirm on WhatsApp or in-store instead. For skincare advice, give gentle general guidance and recommend consulting a dermatologist for persistent, painful, or serious concerns. Never claim to be a doctor.`;

function isRateLimited(key: string): boolean {
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

  if (requestLog.size > 1000) {
    for (const [entryKey, timestamps] of requestLog) {
      if (timestamps.every((timestamp) => now - timestamp >= WINDOW_MS)) {
        requestLog.delete(entryKey);
      }
    }
  }

  return false;
}

function parseMessages(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== "object" || !("messages" in body)) {
    return null;
  }

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

function getClientKey(ip: string | undefined): string {
  return ip?.split(",")[0]?.trim() || "unknown";
}

export async function streamChatResponse(
  body: unknown,
  ip: string | undefined,
  res: Response,
): Promise<void> {
  const messages = parseMessages(body);
  if (!messages) {
    res.status(400).json({ error: "Please send up to 10 valid chat messages." });
    return;
  }

  if (isRateLimited(getClientKey(ip))) {
    res
      .status(429)
      .json({ error: "Too many messages. Please try again in a minute." });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Chat service is not configured yet." });
    return;
  }

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
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
      },
    );
  } catch (error) {
    logger.error({ err: error }, "Unable to reach Groq");
    res.status(502).json({
      error: "I couldn't reach the beauty assistant right now. Please try again.",
    });
    return;
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text();
    logger.warn(
      { status: upstream.status, detail: detail.slice(0, 500) },
      "Groq rejected chat request",
    );
    res.status(upstream.status === 429 ? 429 : 502).json({
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

  const send = (content: string) => {
    res.write(`data: ${JSON.stringify({ content })}\n\n`);
  };

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
          if (content) send(content);
        } catch {
          // Groq sends complete JSON lines, but an incomplete frame can occur
          // at a transport boundary. The next frame will complete the stream.
        }
      }
    }

    res.write("data: [DONE]\n\n");
  } finally {
    reader.releaseLock();
    res.end();
  }
}