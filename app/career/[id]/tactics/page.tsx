"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { Zap } from "lucide-react";
import { getOvrColor, getPositionColor } from "@/lib/utils";
import type { Career, Player } from "@/types";

const C = { card: "#0E1325", border: "rgba(255,255,255,0.055)", accent: "#00FF41", text: "#F1F5F9", textSec: "#94A3B8" };

const FORMATIONS: Record<string, { pos: string; x: number; y: number }[]> = {
  "4-3-3": [
    { pos: "GK",  x: 50, y: 88 },
    { pos: "RB",  x: 82, y: 72 }, { pos: "CB",  x: 62, y: 72 }, { pos: "CB",  x: 38, y: 72 }, { pos: "LB",  x: 18, y: 72 },
    { pos: "CM",  x: 72, y: 52 }, { pos: "CM",  x: 50, y: 48 }, { pos: "CM",  x: 28, y: 52 },
    { pos: "RW",  x: 82, y: 26 }, { pos: "ST",  x: 50, y: 18 }, { pos: "LW",  x: 18, y: 26 },
  ],
  "4-2-3-1": [
    { pos: "GK",  x: 50, y: 88 },
    { pos: "RB",  x: 82, y: 72 }, { pos: "CB",  x: 62, y: 72 }, { pos: "CB",  x: 38, y: 72 }, { pos: "LB",  x: 18, y: 72 },
    { pos: "CDM", x: 64, y: 56 }, { pos: "CDM", x: 36, y: 56 },
    { pos: "RM",  x: 82, y: 38 }, { pos: "CAM", x: 50, y: 36 }, { pos: "LM",  x: 18, y: 38 },
    { pos: "ST",  x: 50, y: 18 },
  ],
  "4-4-2": [
    { pos: "GK",  x: 50, y: 88 },
    { pos: "RB",  x: 82, y: 72 }, { pos: "CB",  x: 62, y: 72 }, { pos: "CB",  x: 38, y: 72 }, { pos: "LB",  x: 18, y: 72 },
    { pos: "RM",  x: 82, y: 50 }, { pos: "CM",  x: 62, y: 50 }, { pos: "CM",  x: 38, y: 50 }, { pos: "LM",  x: 18, y: 50 },
    { pos: "ST",  x: 64, y: 22 }, { pos: "ST",  x: 36, y: 22 },
  ],
  "3-5-2": [
    { pos: "GK",  x: 50, y: 88 },
    { pos: "CB",  x: 72, y: 72 }, { pos: "CB",  x: 50, y: 72 }, { pos: "CB",  x: 28, y: 72 },
    { pos: "RWB", x: 88, y: 52 }, { pos: "CM",  x: 68, y: 52 }, { pos: "CM",  x: 50, y: 48 }, { pos: "CM",  x: 32, y: 52 }, { pos: "LWB", x: 12, y: 52 },
    { pos: "ST",  x: 64, y: 22 }, { pos: "ST",  x: 36, y: 22 },
  ],
};

const FORMATION_NAMES = Object.keys(FORMATIONS);

function FootballPitch({ formation, players }: { formation: string; players: Player[] }) {
  const slots = FORMATIONS[formation] ?? FORMATIONS["4-3-3"];

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 380, aspectRatio: "0.68" }}>
      {/* Pitch background */}
      <svg viewBox="0 0 100 148" style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
        {/* Grass stripes */}
        {[0,1,2,3,4,5,6,7].map((i) => (
          <rect key={i} x="0" y={i * 18.5} width="100" height="18.5"
            fill={i % 2 === 0 ? "#1a5c2e" : "#1d6633"} />
        ))}
        {/* Outline */}
        <rect x="3" y="3" width="94" height="142" rx="1" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
        {/* Centre line */}
        <line x1="3" y1="74" x2="97" y2="74" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
        {/* Centre circle */}
        <circle cx="50" cy="74" r="12" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
        <circle cx="50" cy="74" r="0.8" fill="rgba(255,255,255,0.3)" />
        {/* Penalty areas */}
        <rect x="22" y="3" width="56" height="20" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
        <rect x="22" y="125" width="56" height="20" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
        {/* 6-yard boxes */}
        <rect x="34" y="3" width="32" height="9" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <rect x="34" y="136" width="32" height="9" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        {/* Penalty spots */}
        <circle cx="50" cy="29" r="0.8" fill="rgba(255,255,255,0.3)" />
        <circle cx="50" cy="119" r="0.8" fill="rgba(255,255,255,0.3)" />
      </svg>

      {/* Player tokens */}
      {slots.map((slot, i) => {
        const player = players.find((p) => p.position === slot.pos) ?? players[i];
        const posColor = getPositionColor(slot.pos);
        const x = `${slot.x}%`;
        const y = `${slot.y}%`;

        return (
          <div key={i} style={{
            position: "absolute",
            left: x, top: y,
            transform: "translate(-50%, -50%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            zIndex: 2
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: `linear-gradient(135deg, ${posColor}CC, ${posColor}88)`,
              border: `2px solid ${posColor}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 8px ${posColor}60`,
              fontSize: 9, fontWeight: 900, color: "#fff"
            }}>
              {player?.overall ?? slot.pos.substring(0, 2)}
            </div>
            <div style={{
              fontSize: 8, fontWeight: 700, color: "#fff",
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
              maxWidth: 52, textAlign: "center", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              {player?.name?.split(" ").pop() ?? slot.pos}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TacticsPage() {
  const { id: careerId } = useParams<{ id: string }>();
  const [career, setCareer]         = useState<Career | null>(null);
  const [squad, setSquad]           = useState<Player[]>([]);
  const [formation, setFormation]   = useState("4-3-3");
  const [report, setReport]         = useState("");
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetch("/api/careers").then((r) => r.ok ? r.json() : []).then((careers: Career[]) => {
      setCareer(careers.find((c) => c.id === careerId) ?? null);
    });
    fetch(`/api/players?career_id=${careerId}&squad=true&sort=overall&limit=30`)
      .then((r) => r.ok ? r.json() : { players: [] })
      .then((d) => { setSquad(d.players ?? []); setLoading(false); });
  }, [careerId]);

  async function generateReport() {
    setGenerating(true);
    const r = await fetch("/api/reports", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ career_id: careerId, type: "tactical" }),
    });
    if (r.ok) { const d = await r.json(); setReport(d.content ?? ""); }
    setGenerating(false);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0D1A" }}>
      <Sidebar careerId={careerId} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar career={career} />

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Pitch column */}
          <div style={{ width: 420, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0, background: "#080B14" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 12 }}>Tactics Board</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {FORMATION_NAMES.map((f) => (
                  <button key={f} onClick={() => setFormation(f)} style={{
                    padding: "5px 11px", borderRadius: 7, fontSize: 11, cursor: "pointer",
                    background: formation === f ? "rgba(0, 255, 65, 0.1)" : "transparent",
                    color: formation === f ? C.accent : C.textSec,
                    border: `1px solid ${formation === f ? "rgba(0, 255, 65, 0.3)" : C.border}`,
                    fontWeight: formation === f ? 700 : 400, transition: "all 0.15s"
                  }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
              <FootballPitch formation={formation} players={squad} />
              <div style={{ marginTop: 12, fontSize: 12, color: C.textSec, fontWeight: 700 }}>{formation}</div>
            </div>

            <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
              <button onClick={generateReport} disabled={generating} style={{
                width: "100%", padding: "10px", borderRadius: 8, fontSize: 12, cursor: generating ? "not-allowed" : "pointer",
                background: generating ? "transparent" : "rgba(0, 255, 65, 0.08)",
                color: generating ? C.textSec : C.accent,
                border: `1px solid ${generating ? C.border : "rgba(0, 255, 65, 0.3)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontWeight: 700, transition: "all 0.2s"
              }}>
                <Zap size={13} />
                {generating ? "Generating…" : "AI Tactical Report"}
              </button>
            </div>
          </div>

          {/* Right: player list + report */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Squad list */}
            <div style={{ width: 240, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 1 }}>
                Team Attributes
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
                {loading ? (
                  <div style={{ color: C.textSec, fontSize: 13, padding: 8 }}>Loading squad…</div>
                ) : squad.length === 0 ? (
                  <div style={{ color: C.textSec, fontSize: 13, padding: 8 }}>Upload a save file first</div>
                ) : (
                  squad.slice(0, 18).map((p) => (
                    <div key={p.id} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                      borderRadius: 7, marginBottom: 2, transition: "background 0.1s", cursor: "pointer"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <span style={{
                        background: getPositionColor(p.position ?? ""),
                        color: "#fff", borderRadius: 4, padding: "1px 5px",
                        fontSize: 9, fontWeight: 700, width: 28, textAlign: "center", flexShrink: 0
                      }}>{p.position}</span>
                      <span style={{ fontSize: 12, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: getOvrColor(p.overall ?? 0), flexShrink: 0 }}>{p.overall}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tactical report */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 16 }}>
                Tactical Blueprint — {formation}
              </div>
              {report ? (
                <div style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.8, color: "#CBD5E1" }}>
                  {report.split("\n").map((line, i) => {
                    if (line.startsWith("## ")) return <h2 key={i} style={{ fontSize: 14, fontWeight: 800, color: C.accent, margin: "20px 0 8px", paddingBottom: 4, borderBottom: `1px solid ${C.border}` }}>{line.slice(3)}</h2>;
                    if (line.startsWith("- ") || line.startsWith("• ")) return <div key={i} style={{ paddingLeft: 16, marginBottom: 5, color: "#CBD5E1" }}>· {line.slice(2)}</div>;
                    if (line === "") return <br key={i} />;
                    return <p key={i} style={{ margin: "0 0 8px", color: "#CBD5E1" }}>{line}</p>;
                  })}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: 12, color: C.textSec }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>⚙️</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.textSec }}>Choose a formation and generate your tactical report</div>
                  <div style={{ fontSize: 12, color: "#4A556B" }}>AI will analyze your squad and recommend optimal roles</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
