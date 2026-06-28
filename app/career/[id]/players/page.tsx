"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, getOvrColor, getPositionColor } from "@/lib/utils";
import type { Career, Player } from "@/types";

const C = { card: "#0E1325", border: "rgba(255,255,255,0.055)", accent: "#00FF41", text: "#F1F5F9", textSec: "#94A3B8" };
const POSITIONS = ["", "GK","CB","LB","RB","LWB","RWB","CDM","CM","CAM","LM","RM","LW","RW","CF","ST"];

export default function PlayersPage() {
  const { id: careerId } = useParams<{ id: string }>();
  const [career, setCareer]      = useState<Career | null>(null);
  const [players, setPlayers]   = useState<Player[]>([]);
  const [total, setTotal]        = useState(0);
  const [page, setPage]          = useState(1);
  const [pages, setPages]        = useState(1);
  const [loading, setLoading]    = useState(false);
  const [search, setSearch]      = useState("");
  const [position, setPosition]  = useState("");
  const [squad, setSquad]        = useState<"" | "true" | "false">("");
  const [maxAge, setMaxAge]      = useState("");
  const [minPot, setMinPot]      = useState("");
  const [sort, setSort]          = useState("overall");
  const [selected, setSelected]  = useState<Player | null>(null);

  useEffect(() => {
    fetch("/api/careers").then((r) => r.ok ? r.json() : []).then((careers: Career[]) => {
      setCareer(careers.find((c) => c.id === careerId) ?? null);
    });
  }, [careerId]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ career_id: careerId, page: String(page), limit: "50", sort });
    if (search)   params.set("search", search);
    if (position) params.set("position", position);
    if (squad)    params.set("squad", squad);
    if (maxAge)   params.set("max_age", maxAge);
    if (minPot)   params.set("min_pot", minPot);
    const r = await fetch(`/api/players?${params}`);
    if (r.ok) { const d = await r.json(); setPlayers(d.players); setTotal(d.total); setPages(d.pages); }
    setLoading(false);
  }, [careerId, page, search, position, squad, maxAge, minPot, sort]);

  useEffect(() => { load(); }, [load]);

  const inp: React.CSSProperties = { background: "#080B14", border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "8px 12px", fontSize: 13 };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0D1A" }}>
      <Sidebar careerId={careerId} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar career={career} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textSec }} />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search players…" style={{ ...inp, paddingLeft: 32, width: "100%" }} />
          </div>
          <select value={position} onChange={(e) => { setPosition(e.target.value); setPage(1); }} style={inp}>
            <option value="">All positions</option>
            {POSITIONS.filter(Boolean).map((p) => <option key={p}>{p}</option>)}
          </select>
          <select value={squad} onChange={(e) => { setSquad(e.target.value as typeof squad); setPage(1); }} style={inp}>
            <option value="">All players</option>
            <option value="true">My squad</option>
            <option value="false">Available</option>
          </select>
          <input placeholder="Max age" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} style={{ ...inp, width: 90 }} type="number" />
          <input placeholder="Min POT" value={minPot} onChange={(e) => setMinPot(e.target.value)} style={{ ...inp, width: 90 }} type="number" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={inp}>
            {["overall","potential","age","value","wage"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <span style={{ fontSize: 12, color: C.textSec, whiteSpace: "nowrap" }}>{total.toLocaleString()} players</span>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#080B14", borderBottom: `1px solid ${C.border}` }}>
                {["Name","Club","League","Pos","OVR","POT","Age","Value","Wage"].map((h) => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: C.textSec, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: C.textSec }}>Loading…</td></tr>
              ) : players.map((p) => (
                <tr key={p.id} onClick={() => setSelected(p)}
                  style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#111829")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: C.text }}>{p.name}</td>
                  <td style={{ padding: "10px 14px", color: C.textSec }}>{p.club_name ?? "—"}</td>
                  <td style={{ padding: "10px 14px", color: C.textSec, fontSize: 12 }}>{p.league ?? "—"}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ background: getPositionColor(p.position ?? ""), color: "#fff", borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 700 }}>{p.position ?? "—"}</span>
                  </td>
                  <td style={{ padding: "10px 14px", color: getOvrColor(p.overall ?? 0), fontWeight: 800 }}>{p.overall ?? "—"}</td>
                  <td style={{ padding: "10px 14px", color: "#8B5CF6", fontWeight: 700 }}>{p.potential ?? "—"}</td>
                  <td style={{ padding: "10px 14px", color: C.textSec }}>{p.age ?? "—"}</td>
                  <td style={{ padding: "10px 14px", color: "#22C55E", fontSize: 12 }}>{p.value ? formatCurrency(p.value) : "—"}</td>
                  <td style={{ padding: "10px 14px", color: C.textSec, fontSize: 12 }}>{p.wage ? formatCurrency(p.wage)+"/w" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: "14px 28px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ background: "none", border: `1px solid ${C.border}`, color: C.textSec, borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 13, color: C.textSec }}>Page {page} of {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} style={{ background: "none", border: `1px solid ${C.border}`, color: C.textSec, borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Player detail drawer */}
        {selected && (
          <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 360, background: "#0E1325", borderLeft: `1px solid ${C.border}`, padding: 24, overflowY: "auto", zIndex: 40 }}>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: C.textSec, cursor: "pointer", marginBottom: 16 }}>✕ Close</button>
            <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900 }}>{selected.name}</h2>
            <div style={{ color: C.textSec, fontSize: 13, marginBottom: 20 }}>{selected.club_name} · {selected.nationality}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[["OVR", selected.overall, getOvrColor(selected.overall ?? 0)], ["POT", selected.potential, "#8B5CF6"], ["Age", selected.age, C.textSec], ["Pos", selected.position, getPositionColor(selected.position ?? "")]].map(([k, v, col]) => (
                <div key={String(k)} style={{ background: "#080B14", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 10, color: C.textSec, marginBottom: 4 }}>{k}</div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: String(col) }}>{v ?? "—"}</div>
                </div>
              ))}
            </div>
            {/* Attributes */}
            {selected.attributes && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, marginBottom: 10 }}>ATTRIBUTES</div>
                {(["pace","shooting","passing","dribbling","defending","physical"] as const).map((attr) => {
                  const val = (selected.attributes as Record<string, number>)[attr] ?? 0;
                  return (
                    <div key={attr} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                        <span style={{ color: C.textSec, textTransform: "capitalize" }}>{attr}</span>
                        <span style={{ color: getOvrColor(val), fontWeight: 700 }}>{val}</span>
                      </div>
                      <div style={{ height: 4, background: "#1a2236", borderRadius: 2 }}>
                        <div style={{ width: `${val}%`, height: "100%", background: getOvrColor(val), borderRadius: 2, transition: "width 0.4s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: 16, fontSize: 13, color: C.textSec }}>
              <div>Value: <span style={{ color: "#22C55E", fontWeight: 700 }}>{selected.value ? formatCurrency(selected.value) : "—"}</span></div>
              <div style={{ marginTop: 6 }}>Wage: <span style={{ color: C.text }}>{selected.wage ? formatCurrency(selected.wage)+"/w" : "—"}</span></div>
              <div style={{ marginTop: 6 }}>Contract until: <span style={{ color: C.text }}>{selected.contract_end ?? "—"}</span></div>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
