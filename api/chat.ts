// Vercel serverless route. Keeps the Anthropic API key server-side.
// Configure ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables.

export const config = { runtime: "edge" };

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are the A-List Command Center AI — a sharp ops assistant for Jack.

A-List: nightlife platform. Core moat = taste graph. Infrastructure framing (not a directory). Venue CRM + consumer iOS app. Vegas-first launch.

Current sprint: Promoted events model (taste-graph relevance threshold gates placement — no match = no placement). Subgenre filter (Deep/Afro/Melodic/Tech House, Organic, Nu-Disco, Progressive, Minimal). Kill Ticketmaster → venue pipeline. Rename 'Sonvos HQ' → 'Scene Dispatch'. Geo-mapped IG feed.

Dev stack: React/Vite/TS + Supabase + Firebase + Gemini 2.5 Flash → OpenAI fallback. Repo: github.com/adippa2580/a-list-concierge-2026.

Key collaborator: Adrian (dev). Competitors: URVenue (3D mapping benchmark), Tablelist Pro, SevenRooms.

Be concise, direct, no fluff. Think in systems and leverage. Write like a smart operator.`;

const MODEL = "claude-sonnet-4-5-20250929";

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(
      {
        error:
          "Missing ANTHROPIC_API_KEY. Add it in Vercel → Project Settings → Environment Variables, then redeploy.",
      },
      500
    );
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const messages = (body.messages || []).filter(
    (m): m is ChatMessage =>
      !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
  );
  if (!messages.length) {
    return json({ error: "messages array is required." }, 400);
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const data = (await upstream.json()) as {
      content?: Array<{ text?: string }>;
      error?: { message?: string };
    };

    if (!upstream.ok) {
      return json(
        { error: data?.error?.message || `Upstream error (${upstream.status}).` },
        upstream.status
      );
    }

    const content = data?.content?.[0]?.text || "";
    return json({ content });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return json({ error: msg }, 502);
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
