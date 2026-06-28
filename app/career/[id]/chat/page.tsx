"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { Send, Bot, User } from "lucide-react";
import type { Career } from "@/types";

const C = { card: "#0E1325", border: "rgba(255,255,255,0.055)", accent: "#00FF41", text: "#F1F5F9", textSec: "#94A3B8" };

interface Msg { role: "user" | "assistant"; content: string; }

const STARTERS = [
  "Analyse my squad and give me priorities for this window",
  "Find me wonderkids under 21 with high potential",
  "Who should I sell to raise funds?",
  "What formation suits my players best?",
  "Can I realistically win the Champions League?",
];

function BrainVisual() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {/* Central node */}
      <circle cx="70" cy="70" r="18" fill="rgba(0, 255, 65, 0.1)" stroke="rgba(0, 255, 65, 0.4)" strokeWidth="1.5" />
      <circle cx="70" cy="70" r="10" fill="rgba(0, 255, 65, 0.2)" />
      {/* Network lines */}
      {[
        [70, 70, 30, 28], [70, 70, 110, 28], [70, 70, 18, 70], [70, 70, 122, 70],
        [70, 70, 30, 112], [70, 70, 110, 112], [70, 70, 70, 18], [70, 70, 70, 122],
        [30, 28, 18, 70], [110, 28, 122, 70], [18, 70, 30, 112], [122, 70, 110, 112],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0, 255, 65, 0.15)" strokeWidth="1" />
      ))}
      {/* Outer nodes */}
      {[
        [30, 28], [110, 28], [18, 70], [122, 70],
        [30, 112], [110, 112], [70, 18], [70, 122],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="7" fill="rgba(0, 255, 65, 0.08)" stroke="rgba(0, 255, 65, 0.3)" strokeWidth="1"
          style={{ animation: `pulse-glow ${1.5 + i * 0.2}s ease-in-out infinite` }} />
      ))}
      {/* Pulsing ring */}
      <circle cx="70" cy="70" r="28" fill="none" stroke="rgba(0, 255, 65, 0.12)" strokeWidth="1"
        style={{ animation: "glow 3s ease-in-out infinite" }} />
    </svg>
  );
}

export default function ChatPage() {
  const { id: careerId } = useParams<{ id: string }>();
  const [career, setCareer] = useState<Career | null>(null);
  const [msgs, setMsgs]   = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy]   = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/careers").then((r) => r.ok ? r.json() : []).then((careers: Career[]) => {
      setCareer(careers.find((c) => c.id === careerId) ?? null);
    });
    loadHistory();
  }, [careerId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function loadHistory() {
    const r = await fetch(`/api/chat?career_id=${careerId}`);
    if (r.ok) {
      const convos = await r.json();
      const history: Msg[] = [];
      convos.forEach((c: { user_message: string; ai_response: string }) => {
        history.push({ role: "user", content: c.user_message });
        history.push({ role: "assistant", content: c.ai_response });
      });
      setMsgs(history);
    }
  }

  async function send(message?: string) {
    const text = (message ?? input).trim();
    if (!text || busy) return;
    setInput("");
    const newMsgs: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(newMsgs);
    setBusy(true);
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        career_id: careerId, message: text,
        history: msgs.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (r.ok) {
      const { response } = await r.json();
      setMsgs([...newMsgs, { role: "assistant", content: response }]);
    } else {
      setMsgs([...newMsgs, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    }
    setBusy(false);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0D1A" }}>
      <Sidebar careerId={careerId} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar career={career} />

        {/* Chat content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header strip */}
          <div style={{ padding: "14px 24px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(0, 255, 65, 0.1)",
              border: "1px solid rgba(0, 255, 65, 0.3)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Bot size={15} color={C.accent} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>AI Sporting Director</div>
              <div style={{ fontSize: 11, color: C.textSec }}>Elite football intelligence · Career context loaded</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.accent }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, boxShadow: "0 0 6px rgba(0,255,65,0.8)" }} />
              Online
            </div>
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Empty state with brain visual */}
            {msgs.length === 0 && (
              <div style={{ textAlign: "center", marginTop: 40 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                  <BrainVisual />
                </div>
                <h2 style={{ fontWeight: 900, margin: "0 0 8px", color: C.text, fontSize: 18 }}>Ask your Sporting Director</h2>
                <p style={{ color: C.textSec, fontSize: 13, marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>
                  Get elite tactical advice, transfer recommendations, and squad analysis from your AI director.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 480, margin: "0 auto" }}>
                  {STARTERS.map((s) => (
                    <button key={s} onClick={() => send(s)} style={{
                      padding: "11px 16px", background: C.card,
                      border: "1px solid rgba(0, 255, 65, 0.1)",
                      borderRadius: 10, color: C.textSec, cursor: "pointer",
                      textAlign: "left", fontSize: 13, transition: "all 0.15s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(0, 255, 65, 0.3)";
                      e.currentTarget.style.color = C.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(0, 255, 65, 0.1)";
                      e.currentTarget.style.color = C.textSec;
                    }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {msgs.map((m, i) => (
              <div key={i} className="fade-in" style={{ display: "flex", gap: 10, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: m.role === "user"
                    ? "#172038"
                    : "rgba(0, 255, 65, 0.1)",
                  border: m.role === "user"
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(0, 255, 65, 0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {m.role === "user"
                    ? <User size={12} color={C.textSec} />
                    : <Bot size={12} color={C.accent} />}
                </div>
                <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ fontSize: 10, color: "#4A556B", marginBottom: 4 }}>
                    {m.role === "user" ? "You" : "Sporting Director"}
                  </div>
                  <div style={{
                    background: m.role === "user" ? "#172038" : C.card,
                    border: `1px solid ${m.role === "user" ? "rgba(45, 79, 128, 0.5)" : "rgba(0, 255, 65, 0.1)"}`,
                    borderRadius: m.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                    padding: "10px 14px", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", color: C.text
                  }}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {busy && (
              <div style={{ display: "flex", gap: 10 }} className="fade-in">
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "rgba(0, 255, 65, 0.1)",
                  border: "1px solid rgba(0, 255, 65, 0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Bot size={12} color={C.accent} />
                </div>
                <div style={{
                  background: C.card, border: "1px solid rgba(0, 255, 65, 0.1)",
                  borderRadius: "4px 12px 12px 12px", padding: "14px 18px",
                  display: "flex", gap: 5, alignItems: "center"
                }}>
                  {[0,1,2].map((i) => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: "50%", background: C.accent,
                      animation: `dot 0.9s ${i * 0.18}s ease-in-out infinite alternate`
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, flexShrink: 0 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Type a message…"
              style={{
                flex: 1, background: C.card,
                border: "1px solid rgba(0, 255, 65, 0.15)",
                color: C.text, borderRadius: 12, padding: "12px 16px",
                fontSize: 14, outline: "none", transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = "rgba(0, 255, 65, 0.4)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "rgba(0, 255, 65, 0.15)"}
            />
            <button onClick={() => send()} disabled={busy || !input.trim()} style={{
              padding: "12px 20px",
              background: busy || !input.trim()
                ? "rgba(0, 255, 65, 0.05)"
                : "linear-gradient(135deg, #00FF41, #00D93D)",
              border: "none", borderRadius: 12,
              color: busy || !input.trim() ? C.textSec : "#0A0D1A",
              cursor: busy ? "wait" : "pointer", opacity: 1,
              transition: "all 0.2s", boxShadow: !busy && input.trim() ? "0 0 12px rgba(0,255,65,0.3)" : "none"
            }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
