# A-LIST · Command Center

Ops cockpit for the A-List launch. Sprint tracking, blocker wall, note capture with "send to Adrian" clipboard, The Wire, Doc Vault, and an AI Concierge wired to Claude.

## Stack

- React 18 + Vite + TypeScript + Tailwind
- Vercel serverless `/api/chat` route (Edge runtime) → Anthropic API
- `localStorage` persistence (notes, sprint, blockers, chat survive refresh)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. The AI Concierge will return a 500 locally unless you run `vercel dev` with `ANTHROPIC_API_KEY` set — everything else works offline.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import it in https://vercel.com/new.
3. Framework preset: **Vite** (auto-detected). Leave build command and output dir as defaults.
4. Add env var **`ANTHROPIC_API_KEY`** = your key from https://console.anthropic.com/settings/keys.
5. Deploy.

## Env vars

| Name                | Where           | Required for         |
| ------------------- | --------------- | -------------------- |
| `ANTHROPIC_API_KEY` | Vercel → Env    | AI Concierge chat    |

## Structure

```
src/
  App.tsx                 Main command center
  components/             Panel, Badge, Dot
  data.ts                 Initial sprint / blockers / wire / docs
  storage.ts              Persistent state hook
  theme.ts                Colors + tag palette
  api.ts                  Client → /api/chat
api/chat.ts               Serverless Edge handler (Anthropic)
```

## Next to activate

- Swap initial sprint/blocker/wire/doc arrays in `src/data.ts` for Supabase-backed data.
- Wire the Doc Vault tiles to their real files (Notion / Drive / GitHub).
- Replace "Send to Adrian" clipboard with direct Slack / email via Vercel route.
