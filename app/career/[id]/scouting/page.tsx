"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { Search, Star, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, getOvrColor, getPositionColor } from "@/lib/utils";
import type { Career, Player } from "@/types";

const C = { card: "#0E1325", border: "rgba(255,255,255,0.055)", accent: "#00FF41", text: "#F1F5F9", textSec: "#94A3B8" };
const POSITIONS = ["GK","CB","LB","RB","LWB","RWB","CDM","CM","CAM","LM","RM","LW","RW","CF","ST"];

function OvrBadge({ value, size = 36 }: { value: number | null; size?: number }) {
  const color = getOvrColor(value ?? 0);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid ${color}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: `${color}18`, flexShrink: 0,
      boxShadow: `0 0 6px ${color}40`
    }}>
      <span style={{ fontSize: size * 0.33, fontWeight: 900, color }}>{value ?? "—"}</span>
    </div>
  );
}

function PlayerCard({ player, shortlisted, onToggleShortlist }: {
  player: Player;
  shortlisted: boolean;
  onToggleShortlist: () => void;
}) {
  const posColor = getPositionColor(player.position ?? "");

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 16, transition: "all 0.2s", cursor: "pointer"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = "rgba(0, 255, 65, 0.25)";
      e.currentTarget.style.boxShadow = "0 0 12px rgba(0, 255, 65, 0.1)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = C.border;
      e.currentTarget.style.boxShadow = "none";
    }}>
      {/* Top row: badge + shortlist */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
          background: `${posColor}22`, color: posColor, border: `1px solid ${posColor}44`
        }}>{player.position ?? "?"}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleShortlist(); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
          <Star size={14} fill={shortlisted ? "#F59E0B" : "none"} color={shortlisted ? "#F59E0B" : C.textSec} />
        </button>
      </div>

      {/* Player identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: "linear-gradient(135deg, #0E1325, #1a2236)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 700, color: C.textSec, flexShrink: 0
        }}>
          {player.name.charAt(0)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{player.name}</div>
          <div style={{ fontSize: 11, color: C.textSec, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{player.club_name ?? "Free Agent"}</div>
        </div>
      </div>

      {/* OVR / POT */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, background: "#080B14", borderRadius: 8, padding: "8px", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: getOvrColor(player.overall ?? 0) }}>{player.overall ?? "—"}</div>
          <div style={{ fontSize: 9, color: C.textSec, marginTop: 1, textTransform: "uppercase" }}>OVR</div>
        </div>
        <div style={{ flex: 1, background: "#080B14", borderRadius: 8, padding: "8px", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#8B5CF6" }}>{player.potential ?? "—"}</div>
          <div style={{ fontSize: 9, color: C.textSec, marginTop: 1, textTransform: "uppercase" }}>POT</div>
        </div>
        <div style={{ flex: 1, background: "#080B14", borderRadius: 8, padding: "8px", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.textSec }}>{player.age ?? "—"}</div>
          <div style={{ fontSize: 9, color: C.textSec, marginTop: 1, textTransform: "uppercase" }}>AGE</div>
        </div>
      </div>

      {/* Value */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: C.textSec }}>{player.nationality ?? "—"}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#22C55E" }}>
          {player.value ? formatCurrency(player.value) : "—"}
        </span>
      </div>
    </div>
  );
}

export default function ScoutingPage() {
  const { id: careerId } = useParams<{ id: string }>();
  const [career, setCareer] = useState<Career | null>(null);
  const [players, setPlayers]     = useState<Player[]>([]);
  const [shortlist, setShortlist] = useState<Set<string>>(new Set());
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");
  const [position, setPosition]   = useState("");
  const [maxAge, setMaxAge]       = useState("");
  const [minPot, setMinPot]       = useState("75");
  const [tab, setTab]             = useState<"search" | "shortlist">("search");

  useEffect(() => {
    fetch("/api/careers").then((r) => r.ok ? r.json() : []).then((careers: Career[]) => {
      setCareer(careers.find((c) => c.id === careerId) ?? null);
    });
  }, [careerId]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ career_id: careerId, page: String(page), limit: "24", sort: "potential", squad: "false" });
    if (search)   params.set("search", search);
    if (position) params.set("position", position);
    if (maxAge)   params.set("max_age", maxAge);
    if (minPot)   params.set("min_pot", minPot);
    const r = await fetch(`/api/players?${params}`);
    if (r.ok) { const d = await r.json(); setPlayers(d.players); setTotal(d.total); setPages(d.pages); }
    setLoading(false);
  }, [careerId, page, search, position, maxAge, minPot]);

  useEffect(() => { load(); }, [load]);

  const inp: React.CSSProperties = {
    background: "#080B14", border: `1px solid ${C.border}`, color: C.text,
    borderRadius: 8, padding: "8px 12px", fontSize: 13, width: "100%",
    outline: "none", transition: "border-color 0.2s"
  };

  const shortlisted = players.filter((p) => shortlist.has(p.id));
  const displayList = tab === "shortlist" ? shortlisted : players;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0D1A" }}>
      <Sidebar careerId={careerId} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar career={career} />

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Filter panel */}
          <div style={{
            width: 200, background: "#080B14", borderRight: `1px solid ${C.border}`,
            padding: 16, display: "flex", flexDirection: "column", gap: 16, flexShrink: 0, overflowY: "auto"
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>Filters</div>

            {[
              { label: "Position", el: (
                <select value={position} onChange={(e) => { setPosition(e.target.value); setPage(1); }} style={inp}>
                  <option value="">All</option>
                  {POSITIONS.map((p) => <option key={p}>{p}</option>)}
                </select>
              )},
              { label: "Max Age", el: (
                <input type="number" placeholder="e.g. 25" value={maxAge} onChange={(e) => { setMaxAge(e.target.value); setPage(1); }} style={inp} />
              )},
              { label: "Min Potential", el: (
                <input type="number" placeholder="e.g. 75" value={minPot} onChange={(e) => { setMinPot(e.target.value); setPage(1); }} style={inp} />
              )},
            ].map(({ label, el }) => (
              <div key={label}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textSec, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
                {el}
              </div>
            ))}

            <button
              onClick={() => { setPosition(""); setMaxAge(""); setMinPot("75"); setPage(1); }}
              style={{
                marginTop: "auto", padding: "8px", borderRadius: 7,
                background: "none", border: `1px solid ${C.border}`,
                color: C.textSec, fontSize: 11, cursor: "pointer", transition: "all 0.2s"
              }}
            >
              Reset filters
            </button>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Search + tabs */}
            <div style={{
              padding: "14px 20px", borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", gap: 12, flexShrink: 0
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginRight: 8 }}>
                Advanced Scouting Database
              </div>
              <div style={{ position: "relative", flex: 1, maxWidth: 260 }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textSec }} />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search database…"
                  style={{ ...inp, paddingLeft: 32, width: "100%" }} />
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                {(["search", "shortlist"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                    background: tab === t ? "rgba(0, 255, 65, 0.1)" : "#080B14",
                    color: tab === t ? C.accent : C.textSec,
                    border: `1px solid ${tab === t ? "rgba(0, 255, 65, 0.3)" : C.border}`,
                    fontWeight: tab === t ? 700 : 400, transition: "all 0.15s"
                  }}>
                    {t === "search" ? `Results (${total})` : `Shortlist (${shortlist.size})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Card grid */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 180, borderRadius: 12 }} />
                  ))}
                </div>
              ) : displayList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 20px", color: C.textSec }}>
                  <Search size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <div>{tab === "shortlist" ? "No players shortlisted yet." : "No players match filters."}</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                  {displayList.map((p) => (
                    <PlayerCard
                      key={p.id}
                      player={p}
                      shortlisted={shortlist.has(p.id)}
                      onToggleShortlist={() => setShortlist((prev) => {
                        const n = new Set(prev);
                        n.has(p.id) ? n.delete(p.id) : n.add(p.id);
                        return n;
                      })}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {pages > 1 && tab === "search" && (
              <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, justifyContent: "center", flexShrink: 0 }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ background: "#080B14", border: `1px solid ${C.border}`, color: C.textSec, borderRadius: 6, padding: "6px 10px", cursor: "pointer", opacity: page === 1 ? 0.4 : 1 }}>
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: 12, color: C.textSec }}>Page {page} of {pages}</span>
                <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                  style={{ background: "#080B14", border: `1px solid ${C.border}`, color: C.textSec, borderRadius: 6, padding: "6px 10px", cursor: "pointer", opacity: page === pages ? 0.4 : 1 }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
