import type { ChatMessage, ConciergeAction, ConciergeReply } from "./types";

const ACTIONS_RE = /<actions>([\s\S]*?)<\/actions>/i;

function parseActions(raw: string): ConciergeReply {
  const match = raw.match(ACTIONS_RE);
  if (!match) return { content: raw.trim(), actions: [] };

  const content = raw.replace(ACTIONS_RE, "").trim();
  let actions: ConciergeAction[] = [];
  try {
    const parsed = JSON.parse(match[1].trim());
    if (Array.isArray(parsed)) {
      actions = parsed
        .filter(
          (a): a is ConciergeAction =>
            !!a && a.type === "note" && typeof a.text === "string" && a.text.trim().length > 0
        )
        .map((a) => ({ type: "note", text: a.text.trim() }));
    }
  } catch {
    /* swallow — model emitted malformed JSON, just drop it */
  }
  return { content, actions };
}

export async function callConcierge(messages: ChatMessage[]): Promise<ConciergeReply> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
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
  return parseActions(data?.content || "No response.");
}
