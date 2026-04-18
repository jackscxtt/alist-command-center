import { useEffect, useRef, useState } from "react";
import { Badge } from "./components/Badge";
import { Dot } from "./components/Dot";
import { Panel } from "./components/Panel";
import { C, TAG_COLORS } from "./theme";
import {
  DOCS,
  INITIAL_BLOCKERS,
  INITIAL_CHAT_MESSAGE,
  INITIAL_SPRINT,
  SYSTEM_STATUS,
  WIRE,
} from "./data";
import { usePersistentState } from "./storage";
import type { Blocker, ChatMessage, SavedNote, SprintItem } from "./types";
import { callConcierge } from "./api";

type TabId = "notes" | "wire";

export default function App() {
  const [notes, setNotes] = useState("");
  const [savedNotes, setSavedNotes] = usePersistentState<SavedNote[]>("notes", []);
  const [chat, setChat] = usePersistentState<ChatMessage[]>("chat", [INITIAL_CHAT_MESSAGE]);
  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [blockers, setBlockers] = usePersistentState<Blocker[]>("blockers", INITIAL_BLOCKERS);
  const [sprint, setSprint] = usePersistentState<SprintItem[]>("sprint", INITIAL_SPRINT);
  const [showVault, setShowVault] = usePersistentState<boolean>("vault", false);
  const [activeTab, setActiveTab] = usePersistentState<TabId>("tab", "notes");
  const [time, setTime] = useState(new Date());
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 900 : false
  );
  const chatEnd = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const capture = () => {
    if (!notes.trim()) return;
    setSavedNotes((prev) => [
      {
        id: Date.now(),
        text: notes.trim(),
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        sent: false,
      },
      ...prev,
    ]);
    setNotes("");
    notesRef.current?.focus();
  };

  const sendToAdrian = (ids?: number[]) => {
    const pool = ids
      ? savedNotes.filter((n) => ids.includes(n.id))
      : savedNotes.filter((n) => !n.sent);
    if (!pool.length) return;
    const body = `Adrian,\n\nUpdates from Jack:\n\n${pool
      .map((n) => `[${n.date} · ${n.time}]\n${n.text}`)
      .join("\n\n—\n\n")}\n\n— Jack`;
    try {
      void navigator.clipboard.writeText(body);
    } catch {
      /* ignore */
    }
    setSavedNotes((prev) =>
      prev.map((n) => ({ ...n, sent: pool.find((p) => p.id === n.id) ? true : n.sent }))
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const askAI = async () => {
    if (!chatInput.trim() || aiLoading) return;
    const msg = chatInput;
    setChatInput("");
    const next: ChatMessage[] = [...chat, { role: "user", content: msg }];
    setChat(next);
    setAiLoading(true);
    try {
      const reply = await callConcierge(next);

      let capturedNoteIds: number[] = [];
      if (reply.actions.length > 0) {
        const stamp = Date.now();
        const now = new Date();
        const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        const date = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const newNotes: SavedNote[] = reply.actions.map((a, i) => ({
          id: stamp + i,
          text: a.text,
          time,
          date,
          sent: false,
        }));
        capturedNoteIds = newNotes.map((n) => n.id);
        setSavedNotes((prev) => [...newNotes, ...prev]);
      }

      setChat((prev) => [
        ...prev,
        { role: "assistant", content: reply.content, capturedNoteIds },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection error. Try again.";
      setChat((prev) => [...prev, { role: "assistant", content: message }]);
    } finally {
      setAiLoading(false);
    }
  };

  const resolveBlocker = (id: number) =>
    setBlockers((prev) => prev.map((b) => (b.id === id ? { ...b, status: "resolved" } : b)));
  const toggleItem = (i: number) =>
    setSprint((prev) => prev.map((s, idx) => (idx === i ? { ...s, done: !s.done } : s)));
  const resetChat = () => setChat([INITIAL_CHAT_MESSAGE]);

  const doneCount = sprint.filter((s) => s.done).length;
  const progress = Math.round((doneCount / sprint.length) * 100);
  const activeBlockers = blockers.filter((b) => b.status !== "resolved");
  const unsentNotes = savedNotes.filter((n) => !n.sent);

  const gridStyle = isMobile
    ? { display: "flex", flexDirection: "column" as const, gap: "12px", padding: "12px 14px" }
    : {
        display: "grid",
        gridTemplateColumns: "270px 1fr 310px",
        gap: "14px",
        padding: "14px 24px",
      };

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        fontFamily: "'Rajdhani', sans-serif",
        color: C.text,
        position: "relative",
      }}
    >
      <div className="grid-bg" />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* TOP BAR */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            padding: isMobile ? "10px 14px" : "10px 24px",
            borderBottom: `1px solid ${C.border}`,
            background: "rgba(4,8,16,0.97)",
            backdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: isMobile ? "18px" : "22px",
                fontWeight: 900,
                letterSpacing: "0.3em",
                color: C.accent,
              }}
            >
              A-LIST
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                color: C.textMuted,
                letterSpacing: "0.1em",
              }}
            >
              COMMAND CENTER · v0.9 · VEGAS
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "10px" : "20px",
              flexWrap: "wrap",
            }}
          >
            {!isMobile && (
              <div style={{ display: "flex", gap: "14px" }}>
                {SYSTEM_STATUS.map((s) => (
                  <div
                    key={s.label}
                    style={{ display: "flex", alignItems: "center", gap: "5px" }}
                  >
                    <Dot color={s.color} pulse />
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "9px",
                        color: C.textMuted,
                        letterSpacing: "0.08em",
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {!isMobile && <div style={{ width: "1px", height: "20px", background: C.border }} />}
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: isMobile ? "12px" : "15px",
                color: C.accent,
                letterSpacing: "0.08em",
              }}
            >
              {time.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
            {!isMobile && (
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  color: C.textMuted,
                }}
              >
                {time
                  .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  .toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* MAIN GRID */}
        <div style={gridStyle}>
          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Panel
              title="Current Sprint"
              accent={C.accent}
              action={
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px",
                    color: C.accent,
                  }}
                >
                  {doneCount}/{sprint.length}
                </span>
              }
            >
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: C.textSec }}>
                    Promoted Events Model
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      color: C.textMuted,
                    }}
                  >
                    {progress}%
                  </span>
                </div>
                <div
                  style={{
                    background: "rgba(0,180,216,0.1)",
                    height: "2px",
                    borderRadius: "1px",
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      background: C.accent,
                      borderRadius: "1px",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
              {sprint.map((item, i) => (
                <div
                  key={i}
                  onClick={() => toggleItem(i)}
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "flex-start",
                    padding: "5px 0",
                    cursor: "pointer",
                    borderBottom: i < sprint.length - 1 ? `1px solid ${C.border}` : "none",
                    opacity: item.done ? 0.45 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: "13px",
                      height: "13px",
                      border: `1px solid ${item.done ? C.green : C.border}`,
                      borderRadius: "2px",
                      background: item.done ? C.green : "transparent",
                      flexShrink: 0,
                      marginTop: "2px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    {item.done && (
                      <span
                        style={{ color: "#000", fontSize: "8px", fontWeight: 700, lineHeight: 1 }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      lineHeight: 1.4,
                      textDecoration: item.done ? "line-through" : "none",
                      color: item.done ? C.textMuted : C.text,
                    }}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </Panel>

            <Panel
              title={`Blockers · ${activeBlockers.length} active`}
              accent={activeBlockers.length > 0 ? C.amber : C.green}
            >
              {blockers.map((b) => (
                <div
                  key={b.id}
                  className="blocker-card"
                  style={{
                    padding: "10px",
                    borderRadius: "3px",
                    marginBottom: "8px",
                    background:
                      b.status === "resolved"
                        ? "rgba(16,185,129,0.05)"
                        : "rgba(245,158,11,0.05)",
                    border: `1px solid ${
                      b.status === "resolved"
                        ? "rgba(16,185,129,0.15)"
                        : "rgba(245,158,11,0.2)"
                    }`,
                    opacity: b.status === "resolved" ? 0.45 : 1,
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "5px",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: b.status === "resolved" ? C.green : C.amber,
                      }}
                    >
                      {b.title}
                    </span>
                    {b.status !== "resolved" && (
                      <button
                        className="hud-btn"
                        onClick={() => resolveBlocker(b.id)}
                        style={{
                          border: `1px solid ${C.textMuted}`,
                          color: C.textMuted,
                          fontSize: "8px",
                          padding: "2px 7px",
                          borderRadius: "2px",
                        }}
                      >
                        DONE
                      </button>
                    )}
                    {b.status === "resolved" && <Badge label="RESOLVED" color={C.green} />}
                  </div>
                  <p style={{ fontSize: "11px", color: C.textSec, lineHeight: 1.45 }}>
                    {b.detail}
                  </p>
                </div>
              ))}
            </Panel>
          </div>

          {/* CENTER */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                gap: "2px",
                background: "rgba(0,180,216,0.04)",
                padding: "3px",
                borderRadius: "4px",
                border: `1px solid ${C.border}`,
                width: "fit-content",
              }}
            >
              {(
                [
                  { id: "notes", label: "Notes" },
                  { id: "wire", label: "The Wire" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  className="hud-btn"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: activeTab === tab.id ? C.accent : "transparent",
                    color: activeTab === tab.id ? "#000" : C.textSec,
                    border: "none",
                    padding: "7px 18px",
                    borderRadius: "3px",
                    fontSize: "9px",
                    fontWeight: activeTab === tab.id ? 700 : 400,
                  }}
                >
                  {tab.label.toUpperCase()}
                </button>
              ))}
            </div>

            {activeTab === "notes" && (
              <>
                <Panel title="Quick Capture">
                  <textarea
                    ref={notesRef}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") capture();
                    }}
                    placeholder="Capture a thought, decision, or update for Adrian…"
                    style={{
                      width: "100%",
                      background: "rgba(0,180,216,0.03)",
                      border: `1px solid ${C.border}`,
                      color: C.text,
                      padding: "12px 14px",
                      borderRadius: "3px",
                      fontSize: "14px",
                      lineHeight: 1.65,
                      resize: "none",
                      minHeight: "110px",
                      fontFamily: "'Rajdhani', sans-serif",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "10px",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "10px",
                        color: C.textMuted,
                      }}
                    >
                      ⌘ + Enter to capture
                    </span>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {unsentNotes.length > 0 && (
                        <button
                          className="hud-btn"
                          onClick={() => sendToAdrian()}
                          style={{
                            background: "rgba(245,158,11,0.08)",
                            border: `1px solid ${C.amber}`,
                            color: copied ? C.green : C.amber,
                            fontSize: "9px",
                            padding: "7px 14px",
                            borderRadius: "3px",
                          }}
                        >
                          {copied
                            ? "COPIED TO CLIPBOARD ✓"
                            : `→ SEND ALL TO ADRIAN (${unsentNotes.length})`}
                        </button>
                      )}
                      <button
                        className="hud-btn"
                        onClick={capture}
                        disabled={!notes.trim()}
                        style={{
                          background: notes.trim() ? C.accent : "rgba(0,180,216,0.08)",
                          border: "none",
                          color: notes.trim() ? "#000" : C.textMuted,
                          fontSize: "9px",
                          padding: "7px 20px",
                          borderRadius: "3px",
                          fontWeight: 700,
                          transition: "all 0.2s",
                        }}
                      >
                        CAPTURE
                      </button>
                    </div>
                  </div>
                </Panel>

                {savedNotes.length > 0 && (
                  <Panel
                    title={`Notes · ${savedNotes.length}`}
                    action={
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "10px",
                          color: C.textMuted,
                        }}
                      >
                        {savedNotes.filter((n) => n.sent).length} sent to Adrian
                      </span>
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        maxHeight: "320px",
                        overflowY: "auto",
                        paddingRight: "4px",
                      }}
                    >
                      {savedNotes.map((note) => (
                        <div
                          key={note.id}
                          className="fade-up"
                          style={{
                            padding: "10px 12px",
                            borderRadius: "3px",
                            background: note.sent
                              ? "rgba(16,185,129,0.04)"
                              : "rgba(0,180,216,0.04)",
                            border: `1px solid ${
                              note.sent ? "rgba(16,185,129,0.2)" : C.border
                            }`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "6px",
                              gap: "6px",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: "10px",
                                color: C.textMuted,
                              }}
                            >
                              {note.date} · {note.time}
                            </span>
                            {note.sent ? (
                              <Badge label="SENT TO ADRIAN" color={C.green} />
                            ) : (
                              <button
                                className="hud-btn"
                                onClick={() => sendToAdrian([note.id])}
                                style={{
                                  background: "none",
                                  border: `1px solid ${C.amber}`,
                                  color: C.amber,
                                  fontSize: "9px",
                                  padding: "2px 8px",
                                  borderRadius: "2px",
                                }}
                              >
                                → ADRIAN
                              </button>
                            )}
                          </div>
                          <p style={{ fontSize: "13px", lineHeight: 1.55, color: C.text }}>
                            {note.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}
              </>
            )}

            {activeTab === "wire" && (
              <Panel title="The Wire — Chronological Updates">
                <div>
                  {WIRE.map((item, i) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        gap: "14px",
                        paddingBottom: i < WIRE.length - 1 ? "14px" : 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "0",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: C.accent,
                            flexShrink: 0,
                            marginTop: "3px",
                          }}
                        />
                        {i < WIRE.length - 1 && (
                          <div
                            style={{
                              width: "1px",
                              flex: 1,
                              background: C.border,
                              marginTop: "4px",
                            }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          paddingBottom: i < WIRE.length - 1 ? "6px" : 0,
                          borderBottom:
                            i < WIRE.length - 1 ? `1px solid ${C.border}` : "none",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            marginBottom: "5px",
                          }}
                        >
                          <Badge label={item.tag} color={TAG_COLORS[item.tag] || C.accent} />
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "10px",
                              color: C.textMuted,
                            }}
                          >
                            {item.date}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            marginBottom: "4px",
                            color: C.text,
                          }}
                        >
                          {item.title}
                        </div>
                        <p style={{ fontSize: "12px", color: C.textSec, lineHeight: 1.5 }}>
                          {item.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>

          {/* RIGHT — AI */}
          <div>
            <Panel
              title="AI Concierge"
              accent={C.purple}
              action={
                <button
                  className="hud-btn"
                  onClick={resetChat}
                  title="Clear conversation"
                  style={{
                    border: `1px solid ${C.border}`,
                    color: C.textMuted,
                    fontSize: "8px",
                    padding: "2px 7px",
                    borderRadius: "2px",
                  }}
                >
                  RESET
                </button>
              }
              style={{
                display: "flex",
                flexDirection: "column",
                height: isMobile ? "65vh" : "calc(100vh - 110px)",
              }}
            >
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  paddingRight: "2px",
                  minHeight: 0,
                }}
              >
                {chat.map((msg, i) => (
                  <div
                    key={i}
                    className="fade-up"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "88%",
                        padding: "10px 12px",
                        borderRadius:
                          msg.role === "user" ? "8px 8px 2px 8px" : "8px 8px 8px 2px",
                        background:
                          msg.role === "user"
                            ? "rgba(124,58,237,0.14)"
                            : "rgba(0,180,216,0.06)",
                        border: `1px solid ${
                          msg.role === "user" ? "rgba(124,58,237,0.3)" : C.border
                        }`,
                        fontSize: "13px",
                        lineHeight: 1.55,
                        color: C.text,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.content}
                    </div>
                    {msg.role === "assistant" && msg.capturedNoteIds && msg.capturedNoteIds.length > 0 && (
                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "10px",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: C.accent,
                          opacity: 0.85,
                        }}
                      >
                        → Captured {msg.capturedNoteIds.length} note
                        {msg.capturedNoteIds.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ display: "flex", gap: "5px", padding: "8px 12px" }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          background: C.accent,
                          animation: `blink 1.2s ${i * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}
                <div ref={chatEnd} />
              </div>
              <div
                style={{
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: "12px",
                  marginTop: "10px",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) askAI();
                  }}
                  placeholder="Ask anything about A-List…"
                  style={{
                    flex: 1,
                    background: "rgba(0,180,216,0.04)",
                    border: `1px solid ${C.border}`,
                    color: C.text,
                    padding: "8px 12px",
                    borderRadius: "3px",
                    fontSize: "13px",
                    fontFamily: "'Rajdhani', sans-serif",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = C.purple)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                />
                <button
                  className="hud-btn"
                  onClick={askAI}
                  disabled={aiLoading || !chatInput.trim()}
                  style={{
                    background:
                      aiLoading || !chatInput.trim() ? "rgba(124,58,237,0.1)" : C.purple,
                    border: "none",
                    color: aiLoading || !chatInput.trim() ? C.textMuted : "#fff",
                    padding: "8px 14px",
                    borderRadius: "3px",
                    fontSize: "9px",
                    transition: "all 0.2s",
                  }}
                >
                  SEND
                </button>
              </div>
            </Panel>
          </div>
        </div>

        {/* DOC VAULT */}
        <div
          style={{
            borderTop: `1px solid ${C.border}`,
            padding: isMobile ? "0 14px" : "0 24px",
            background: "rgba(4,8,16,0.9)",
          }}
        >
          <button
            className="hud-btn"
            onClick={() => setShowVault((v) => !v)}
            style={{
              border: "none",
              color: C.textSec,
              padding: "12px 0",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "9px",
            }}
          >
            <span style={{ color: C.accent, fontSize: "10px" }}>{showVault ? "▼" : "▶"}</span>
            DOC VAULT · {DOCS.length} DOCUMENTS
            <span style={{ color: C.textMuted, letterSpacing: "0.1em" }}>— CHRONOLOGICAL</span>
          </button>

          {showVault && (
            <div
              className="fade-up"
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "10px",
                paddingBottom: "20px",
              }}
            >
              {DOCS.map((doc) => (
                <div
                  key={doc.id}
                  className="doc-card"
                  style={{
                    padding: "12px 14px",
                    background: "rgba(0,180,216,0.03)",
                    border: `1px solid ${C.border}`,
                    borderRadius: "3px",
                    cursor: "pointer",
                    transition: "all 0.18s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <Badge label={doc.type} color={TAG_COLORS[doc.type] || C.accent} />
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "9px",
                        color: C.textMuted,
                      }}
                    >
                      {doc.date}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: C.text,
                      marginBottom: "8px",
                      lineHeight: 1.35,
                    }}
                  >
                    {doc.title}
                  </div>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {doc.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: "10px",
                          color: C.textMuted,
                          background: "rgba(0,180,216,0.06)",
                          padding: "1px 6px",
                          borderRadius: "2px",
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
