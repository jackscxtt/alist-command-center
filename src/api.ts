import type { ChatMessage } from "./types";

export async function callConcierge(messages: ChatMessage[]): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data?.error || data?.message || "";
    } catch {
      /* ignore */
    }
    if (res.status === 401 || res.status === 500) {
      throw new Error(
        detail || "AI Concierge not configured. Set ANTHROPIC_API_KEY in your Vercel project env vars."
      );
    }
    throw new Error(detail || `Request failed (${res.status}).`);
  }
  const data = await res.json();
  return data?.content || "No response.";
}
