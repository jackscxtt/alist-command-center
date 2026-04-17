import type { Blocker, SprintItem, WireItem, DocItem } from "./types";

export const INITIAL_BLOCKERS: Blocker[] = [
  {
    id: 1,
    title: "Instagram CLIENT_ID",
    detail: "Waiting on Meta. Add to Supabase as INSTAGRAM_CLIENT_ID once received.",
    status: "waiting",
  },
  {
    id: 2,
    title: "Apple Dev Activation",
    detail: "Enrolled AFBULLAPWW. Up to 48hr wait. Then Fastlane/TestFlight setup.",
    status: "in-progress",
  },
  {
    id: 3,
    title: "Spotify Redirect URIs",
    detail: "Clean stale URIs on Spotify dashboard. Verify client secret in Supabase.",
    status: "pending",
  },
];

export const INITIAL_SPRINT: SprintItem[] = [
  { done: true, text: "Monetization locked — bookings-only, no fees" },
  { done: true, text: "Full app audit complete" },
  { done: false, text: "Kill Ticketmaster → build venue pipeline" },
  { done: false, text: "Subgenre filter (Deep/Afro/Melodic, Organic, Nu-Disco, Progressive, Minimal)" },
  { done: false, text: "Rename 'Sonvos HQ' → 'Scene Dispatch'" },
  { done: false, text: "Geo-mapped IG feed by city" },
  { done: false, text: "Taste graph — Spotify/Apple/SoundCloud/IG connectors" },
  { done: false, text: "Promoted events — relevance threshold model" },
];

export const WIRE: WireItem[] = [
  {
    id: 1,
    date: "Apr 14",
    tag: "AUDIT",
    title: "Full App Audit",
    body: "Auth flow clean. 4 tabs, VIP tiers built. AI Concierge placeholder only — Adrian handling. Home feed = Ticketmaster (replace).",
  },
  {
    id: 2,
    date: "Apr 12",
    tag: "DEV",
    title: "Stack Locked",
    body: "React/Vite/TS + Supabase + Firebase hosting. Gemini 2.5 Flash → OpenAI fallback. GitHub Actions CI/CD.",
  },
  {
    id: 3,
    date: "Apr 10",
    tag: "MEETING",
    title: "Adrian — Miami Raise Agenda",
    body: "Kill Ticketmaster default. Subgenre filter priority. Naming. Geo-accounts. Event pipeline. Taste graph integration.",
  },
  {
    id: 4,
    date: "Apr 5",
    tag: "PRODUCT",
    title: "Consumer Monetization Locked",
    body: "No membership fees. Table bookings only. Booking data feeds enterprise/CRM as second revenue line.",
  },
  {
    id: 5,
    date: "Mar 28",
    tag: "GTM",
    title: "Vegas Launch Sequence",
    body: "Prototype → venue pre-sales → soft launch founding Club members → 25 Vegas venues → cash-flow positive → Dallas.",
  },
];

export const DOCS: DocItem[] = [
  { id: 1, date: "Apr 14", title: "App State Audit", type: "DEV", tags: ["audit", "UX", "iOS"] },
  { id: 2, date: "Apr 12", title: "Dev Stack Spec", type: "TECH", tags: ["React", "Supabase", "Firebase"] },
  { id: 3, date: "Apr 10", title: "Adrian Meeting — Miami Raise", type: "NOTES", tags: ["raise", "GTM", "product"] },
  { id: 4, date: "Apr 5", title: "Consumer Monetization Framework", type: "PRODUCT", tags: ["revenue", "bookings"] },
  { id: 5, date: "Mar 28", title: "Vegas Launch Playbook", type: "GTM", tags: ["Vegas", "venues", "launch"] },
  { id: 6, date: "Mar 15", title: "Taste Graph Architecture", type: "TECH", tags: ["moat", "data", "Spotify"] },
  { id: 7, date: "Mar 10", title: "Competitive Teardown", type: "STRATEGY", tags: ["URVenue", "SevenRooms", "Tablelist"] },
  { id: 8, date: "Feb 28", title: "Referral System Spec", type: "PRODUCT", tags: ["points", "venue-side", "rev-share"] },
];

export const SYSTEM_STATUS = [
  { label: "SUPABASE", color: "#10B981" },
  { label: "FIREBASE", color: "#10B981" },
  { label: "INSTAGRAM", color: "#F59E0B" },
  { label: "APPLE DEV", color: "#F59E0B" },
  { label: "SPOTIFY", color: "#F59E0B" },
];

export const INITIAL_CHAT_MESSAGE = {
  role: "assistant" as const,
  content:
    "A-List Command Center online.\n\nLast sprint: Promoted events model + subgenre filter. Three blockers active. What do you need?",
};
