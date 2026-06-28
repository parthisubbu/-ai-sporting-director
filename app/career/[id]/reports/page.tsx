"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { FileText, Zap } from "lucide-react";
import type { Career, Report } from "@/types";

const C = { card: "#0E1325", border: "rgba(255,255,255,0.055)", accent: "#00FF41", text: "#F1F5F9", textSec: "#94A3B8" };

const TYPE_COLOR: Record<string, string> = {
  full: "#F59E0B", squad: C.accent, transfer: "#22C55E", tactical: "#8B5CF6", development: "#3B82F6",
};

export default function ReportsPage() {
  const { id: careerId } = useParams<{ id: string }>();
  const [career, setCareer]     = useState<Career | null>(null);
  const [reports, setReports]   = useState<Report[]>([]);
  const [active, setActive]     = useState<Report | null>(null);
  const [loading, setLoading]   = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/careers").then((r) => r.ok ? r.json() : []).then((careers: Career[]) => {
      setCareer(careers.find((c) => c.id === careerId) ?? null);
    });
  }, [careerId]);

  useEffect(() => { loadReports(); }, [careerId]);

  async function loadReports() {
    const r = await fetch(`/api/reports?career_id=${careerId}`);
    if (r.ok) { const d = await r.json(); setReports(d); if (d[0]) setActive(d[0]); }
    setLoading(false);
  }

  async function generate(type: string) {
    setGenerating(type);
    const r = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ career_id: careerId, type }) });
    if (r.ok) { const rep = await r.json(); setReports((prev) => [rep, ...prev]); setActive(rep); }
    setGenerating(null);
  }

  const TYPES = [
    { type: "full", label: "Full Report" }, { type: "squad", label: "Squad" },
    { type: "transfer", label: "Transfers" }, { type: "tactical", label: "Tactics" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0D1A" }}>
      <Sidebar careerId={careerId} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar career={career} />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: report list */}
        <div style={{ width: 260, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "16px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Generate</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {TYPES.map(({ type, label }) => (
                <button key={type} onClick={() => generate(type)} disabled={!!generating}
                  style={{ padding: "9px 12px", borderRadius: 8, background: "#080B14", border: `1px solid ${C.border}`, color: C.textSec, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
                  <Zap size={12} color={TYPE_COLOR[type]} />
                  {generating === type ? "Generating…" : label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            {loading ? <div style={{ color: C.textSec, fontSize: 13, padding: 12 }}>Loading…</div> :
              reports.map((r) => (
                <div key={r.id} onClick={() => setActive(r)}
                  style={{ padding: "12px", borderRadius: 8, marginBottom: 6, cursor: "pointer", background: active?.id === r.id ? "#0E1325" : "transparent", border: `1px solid ${active?.id === r.id ? C.border : "transparent"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: TYPE_COLOR[r.type] ?? C.accent }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{r.title ?? r.type}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.textSec }}>{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Right: report content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px" }}>
          {active ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <FileText size={18} color={TYPE_COLOR[active.type] ?? C.accent} />
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{active.title}</h1>
                <span style={{ fontSize: 11, color: C.textSec, marginLeft: "auto" }}>{new Date(active.created_at).toLocaleString()}</span>
              </div>
              <div style={{ lineHeight: 1.8, fontSize: 14, color: "#CBD5E1", whiteSpace: "pre-wrap" }}>
                {/* Render markdown-like content */}
                {active.content.split("\n").map((line, i) => {
                  if (line.startsWith("# ")) return <h1 key={i} style={{ fontSize: 20, fontWeight: 900, color: C.text, margin: "24px 0 12px" }}>{line.slice(2)}</h1>;
                  if (line.startsWith("## ")) return <h2 key={i} style={{ fontSize: 16, fontWeight: 800, color: C.accent, margin: "20px 0 10px", borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>{line.slice(3)}</h2>;
                  if (line.startsWith("### ")) return <h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", margin: "16px 0 8px" }}>{line.slice(4)}</h3>;
                  if (line.startsWith("- ") || line.startsWith("• ")) return <div key={i} style={{ paddingLeft: 16, marginBottom: 6, color: "#CBD5E1" }}>· {line.slice(2)}</div>;
                  if (line.startsWith("**") && line.endsWith("**")) return <strong key={i} style={{ display: "block", color: C.text, marginBottom: 4 }}>{line.slice(2, -2)}</strong>;
                  if (line === "") return <br key={i} />;
                  return <p key={i} style={{ margin: "0 0 8px", color: "#CBD5E1" }}>{line}</p>;
                })}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "80px 20px", color: C.textSec }}>
              <FileText size={40} style={{ marginBottom: 16, opacity: 0.3 }} />
              <p>Select or generate a report</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
