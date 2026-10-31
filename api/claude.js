// Serverless proxy for the Claude API (Vercel / Netlify-style Node function).
// Keeps ANTHROPIC_API_KEY on the server so it is never shipped to the browser.
const MAX_PROMPT_CHARS = 8000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: "AI is not configured" });

  const { system, prompt } = req.body || {};
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > MAX_PROMPT_CHARS ||
      (system != null && (typeof system !== "string" || system.length > MAX_PROMPT_CHARS))) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-haiku-5-5",
        max_tokens: 600,
        system: system || undefined,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await upstream.json();
    if (!upstream.ok) return res.status(502).json({ error: data?.error?.message || "Upstream error" });
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    return res.status(200).json({ text });
  } catch {
    return res.status(502).json({ error: "AI request failed" });
  }
}
