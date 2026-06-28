"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { Upload, Zap, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency, getOvrColor } from "@/lib/utils";
import type { Career, Player } from "@/types";

const C = { card: "#0E1325", border: "rgba(255,255,255,0.055)", accent: "#00FF41", text: "#F1F5F9", textSec: "#94A3B8", red: "#EC1C24" };

function CircularGauge({ value, max = 100 }: { value: number; max?: number }) {
  const r = 46, cx = 60, cy = 60;
  const sweep = 240;
  const start = (180 + (360 - sweep) / 2) * (Math.PI / 180);
  const end   = start + (sweep * Math.PI / 180);
  const pct   = Math.min(value / max, 1);
  const arcEnd = start + pct * (sweep * Math.PI / 180);

  const polarToXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  const s1 = polarToXY(start, r), e1 = polarToXY(end, r);
  const s2 = polarToXY(start, r), e2 = polarToXY(arcEnd, r);
  const largeArc1 = sweep > 180 ? 1 : 0;
  const largeArc2 = sweep * pct > 180 ? 1 : 0;

  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <path d={`M${s1.x},${s1.y} A${r},${r} 0 ${largeArc1},1 ${e1.x},${e1.y}`}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" strokeLinecap="round" />
      {value > 0 && (
        <path d={`M${s2.x},${s2.y} A${r},${r} 0 ${largeArc2},1 ${e2.x},${e2.y}`}
          fill="none" stroke={C.accent} strokeWidth="7" strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 4px rgba(0,255,65,0.5))" }} />
      )}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={C.text} fontSize="22" fontWeight="900">{value}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={C.textSec} fontSize="10">/100</text>
    </svg>
  );
}

function RadarChart({ labels, values }: { labels: string[]; values: number[] }) {
  const n = labels.length, cx = 90, cy = 90, r = 65;
  const pt = (i: number, radius: number) => {
    const a = (2 * Math.PI * i / n) - Math.PI / 2;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  };
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const polyStr = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");
  const gridPts = (lvl: number) => Array.from({ length: n }, (_, i) => pt(i, lvl * r));
  const dataPts = values.map((v, i) => pt(i, (v / 100) * r));

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      {gridLevels.map((lvl, gi) => (
        <polygon key={gi} points={polyStr(gridPts(lvl))} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const tip = pt(i, r);
        return <line key={i} x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
      })}
      <polygon points={polyStr(dataPts)} fill="rgba(0, 255, 65, 0.12)" stroke={C.accent} strokeWidth="1.5" />
      {labels.map((label, i) => {
        const p = pt(i, r + 14);
        return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill={C.textSec} fontSize="8">{label}</text>;
      })}
    </svg>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(value / max, 1) * 100;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: C.textSec }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

const CL_DATA = [
  { y: "2029", p: 14 }, { y: "2030", p: 28 }, { y: "2031", p: 42 },
  { y: "2032", p: 57 }, { y: "2033", p: 71 }, { y: "2034", p: 85 },
];

export default function CareerPage() {
  const { id: careerId } = useParams<{ id: string }>();
  const [career, setCareer]       = useState<Career | null>(null);
  const [squad, setSquad]         = useState<Player[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState("");
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => { init(); }, [careerId]);

  async function init() {
    const [cRes, pRes, sRes] = await Promise.all([
      fetch(`/api/careers`),
      fetch(`/api/players?career_id=${careerId}&limit=1`),
      fetch(`/api/players?career_id=${careerId}&squad=true&sort=overall&limit=30`),
    ]);
    if (cRes.ok) {
      const careers: Career[] = await cRes.json();
      setCareer(careers.find((c) => c.id === careerId) ?? null);
    }
    if (pRes.ok) { const d = await pRes.json(); setPlayerCount(d.total ?? 0); }
    if (sRes.ok) { const d = await sRes.json(); setSquad(d.players ?? []); }
  }

  async function handleUpload(file: File) {
    setUploading(true); setProgress("Uploading…");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("career_id", careerId);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    if (!r.ok) { setProgress("Upload failed"); setUploading(false); return; }
    const { upload_id } = await r.json();
    setProgress("Parsing save file…");
    let done = false;
    while (!done) {
      await new Promise((r) => setTimeout(r, 3000));
      const s = await fetch(`/api/upload?upload_id=${upload_id}`);
      const { status } = await s.json();
      if (status === "complete") { setProgress("Complete!"); done = true; init(); }
      else if (status === "failed") { setProgress("Parsing failed"); done = true; }
      else setProgress("Processing players…");
    }
    setUploading(false);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [careerId]);

  // Derived squad stats
  const attackers = squad.filter((p) => ["ST","CF","LW","RW","LF","RF"].includes(p.position ?? ""));
  const mids      = squad.filter((p) => ["CM","CAM","CDM","LM","RM"].includes(p.position ?? ""));
  const defenders = squad.filter((p) => ["CB","LB","RB","LWB","RWB"].includes(p.position ?? ""));
  const gks       = squad.filter((p) => p.position === "GK");

  const avg = (arr: Player[]) => arr.length ? Math.round(arr.reduce((s, p) => s + (p.overall ?? 0), 0) / arr.length) : 0;
  const attackAvg = avg(attackers), midAvg = avg(mids), defAvg = avg(defenders), gkAvg = avg(gks);
  const squadRating = squad.length ? Math.round((attackAvg * 0.3 + midAvg * 0.3 + defAvg * 0.3 + gkAvg * 0.1)) : 0;

  const positionalStrength = [
    { pos: "ATT", value: attackAvg, color: "#EC1C24" },
    { pos: "MID", value: midAvg,    color: "#F59E0B" },
    { pos: "DEF", value: defAvg,    color: "#3B82F6" },
    { pos: "GK",  value: gkAvg,     color: "#22C55E" },
  ];

  const weaknesses = [
    { label: "Lack of depth", area: "Central Mid" },
    { label: "No backup striker", area: "Forward" },
    { label: "Ageing full backs", area: "Wide Defense" },
  ];

  const AI_ACTIONS = [
    { label: "Sign a defensive midfielder", priority: "High", color: "#EC1C24" },
    { label: "Renew striker contract", priority: "Medium", color: "#F59E0B" },
    { label: "Loan academy winger for experience", priority: "Low", color: "#22C55E" },
  ];

  const radarLabels = ["Attack", "Defense", "Midfield", "Pace", "Depth"];
  const radarValues = [attackAvg, defAvg, midAvg, 72, Math.min(squad.length * 2, 80)];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0D1A" }}>
      <Sidebar careerId={careerId} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar career={career} />

        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

          {/* Upload zone (no data state) */}
          {playerCount === 0 && (
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              style={{
                border: `2px dashed ${dragging ? C.accent : "rgba(0, 255, 65, 0.15)"}`,
                borderRadius: 14, padding: 56, textAlign: "center", marginBottom: 28,
                transition: "all 0.2s", background: dragging ? "rgba(0, 255, 65, 0.04)" : "transparent"
              }}
            >
              <Upload size={32} color={C.accent} style={{ marginBottom: 12 }} />
              <h3 style={{ margin: "0 0 8px", fontWeight: 800, color: C.text }}>Upload Career Save</h3>
              <p style={{ color: C.textSec, fontSize: 13, marginBottom: 20 }}>Drag & drop your .sav file to get started</p>
              <label style={{
                padding: "10px 28px",
                background: "linear-gradient(135deg, #00FF41, #00D93D)",
                borderRadius: 8, color: "#0A0D1A", fontWeight: 800, cursor: "pointer", fontSize: 13
              }}>
                Browse Files
                <input type="file" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
              </label>
              {uploading && (
                <div style={{ marginTop: 20, color: C.accent, fontSize: 13, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, animation: "pulse-glow 1s ease-in-out infinite" }} />
                  {progress}
                </div>
              )}
            </div>
          )}

          {/* Main dashboard — Sporting Director Report */}
          {playerCount > 0 && (
            <>
              {/* Report header */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: C.accent, textTransform: "uppercase", marginBottom: 4 }}>
                  AI Generated
                </div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text }}>Sporting Director Report</h1>
              </div>

              {/* Top meta strip */}
              <div style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12, padding: "16px 24px",
                display: "flex", alignItems: "center", gap: 32, marginBottom: 16,
                flexWrap: "wrap"
              }}>
                <div>
                  <div style={{ fontSize: 10, color: C.textSec, marginBottom: 2 }}>Club</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>{career?.club_name ?? "—"}</div>
                </div>
                <div style={{ width: 1, height: 36, background: C.border }} />
                <div>
                  <div style={{ fontSize: 10, color: C.textSec, marginBottom: 2 }}>Season</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>{career?.season ?? "—"}</div>
                </div>
                <div style={{ width: 1, height: 36, background: C.border }} />
                <div>
                  <div style={{ fontSize: 10, color: C.textSec, marginBottom: 2 }}>Difficulty</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.textSec }}>{career?.difficulty ?? "—"}</div>
                </div>
                <div style={{ width: 1, height: 36, background: C.border }} />
                <div>
                  <div style={{ fontSize: 10, color: C.textSec, marginBottom: 2 }}>Players</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.accent }}>{playerCount.toLocaleString()}</div>
                </div>
                {/* Squad Rating gauge pushed right */}
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: C.textSec, marginBottom: 2 }}>Squad Rating</div>
                    <div style={{ fontSize: 11, color: C.textSec }}>Overall performance</div>
                  </div>
                  <CircularGauge value={squadRating} />
                </div>
              </div>

              {/* Main grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>

                {/* Squad Strength */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>Squad Strength</div>
                  {positionalStrength.map((ps) => (
                    <div key={ps.pos} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: C.textSec }}>{ps.pos}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: ps.color }}>{ps.value || "—"}</span>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                        <div style={{
                          width: `${Math.min((ps.value / 99) * 100, 100)}%`,
                          height: "100%", background: ps.color, borderRadius: 2,
                          boxShadow: `0 0 4px ${ps.color}40`, transition: "width 1s ease"
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Transfer Budget */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>Transfer Budget</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.text, marginBottom: 4 }}>£145M</div>
                  <div style={{ fontSize: 12, color: C.accent, marginBottom: 16 }}>£145M remaining</div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <div style={{ width: "100%", height: "100%", background: C.accent, borderRadius: 2, boxShadow: "0 0 6px rgba(0,255,65,0.4)" }} />
                  </div>
                  <div style={{ fontSize: 11, color: C.textSec, marginTop: 8 }}>Full budget available</div>
                </div>

                {/* Wage Budget */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>Wage Budget</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.text, marginBottom: 4 }}>£3.2M<span style={{ fontSize: 14, fontWeight: 400, color: C.textSec }}> p/w</span></div>
                  <div style={{ fontSize: 12, color: "#F59E0B", marginBottom: 16 }}>58% used</div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <div style={{ width: "58%", height: "100%", background: "#F59E0B", borderRadius: 2, boxShadow: "0 0 6px rgba(245,158,11,0.4)" }} />
                  </div>
                  <div style={{ fontSize: 11, color: C.textSec, marginTop: 8 }}>23.2M used of £4M total</div>
                </div>
              </div>

              {/* Bottom grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 14 }}>

                {/* AI Priority Actions */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <Zap size={14} color={C.accent} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 1 }}>AI Priority Actions</div>
                  </div>
                  {AI_ACTIONS.map((action, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "10px 12px", borderRadius: 8, marginBottom: 8,
                      background: "#080B14",
                      borderLeft: `3px solid ${action.color}`
                    }}>
                      <CheckCircle size={13} color={action.color} style={{ marginTop: 1, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{action.label}</div>
                        <div style={{ fontSize: 10, color: action.color, marginTop: 2, fontWeight: 700 }}>{action.priority} Priority</div>
                      </div>
                    </div>
                  ))}
                  {/* Generate button */}
                  <button
                    onClick={async () => {
                      setGenerating("full");
                      await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ career_id: careerId, type: "full" }) });
                      setGenerating(null);
                    }}
                    disabled={!!generating}
                    style={{
                      width: "100%", marginTop: 8, padding: "9px", borderRadius: 8,
                      background: "rgba(0, 255, 65, 0.08)", border: "1px solid rgba(0, 255, 65, 0.2)",
                      color: C.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                    }}
                  >
                    {generating === "full" ? "Generating…" : "Generate Full Report"}
                  </button>
                </div>

                {/* Team Weaknesses radar */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <AlertTriangle size={14} color="#F59E0B" />
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 1 }}>Team Weaknesses</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <RadarChart labels={radarLabels} values={radarValues} />
                  </div>
                  {weaknesses.map((w, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: C.textSec }}>{w.label}</span>
                      <span style={{ fontSize: 10, color: "#4A556B", marginLeft: "auto" }}>{w.area}</span>
                    </div>
                  ))}
                </div>

                {/* Champions League Probability */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <TrendingUp size={14} color={C.accent} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 1 }}>CL Probability</div>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: C.accent, marginBottom: 4 }}>
                    {CL_DATA[CL_DATA.length - 1].p}%
                  </div>
                  <div style={{ fontSize: 11, color: C.textSec, marginBottom: 14 }}>Champions League win</div>
                  <ResponsiveContainer width="100%" height={90}>
                    <LineChart data={CL_DATA} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
                      <XAxis dataKey="y" tick={{ fontSize: 9, fill: C.textSec }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: C.textSec }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#0E1325", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11 }}
                        formatter={(v) => [`${v}%`, "Probability"]}
                      />
                      <Line type="monotone" dataKey="p" stroke={C.accent} strokeWidth={2} dot={false}
                        style={{ filter: "drop-shadow(0 0 4px rgba(0,255,65,0.4))" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
