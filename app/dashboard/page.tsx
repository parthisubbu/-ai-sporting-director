"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { Plus, FolderOpen, Trash2, Upload } from "lucide-react";
import { CardSkeleton, GridSkeleton } from "@/components/ui/Skeleton";
import type { Career } from "@/types";

const C = { card: "#0E1325", border: "rgba(255,255,255,0.055)", accent: "#00FF41", text: "#F1F5F9", textSec: "#94A3B8", red: "#EC1C24" };

export default function DashboardPage() {
  const [careers, setCareers]   = useState<Career[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showNew, setShowNew]   = useState(false);
  const [form, setForm]         = useState({ career_name: "", club_name: "", league: "", season: "", difficulty: "Professional" });
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => { fetchCareers(); }, []);

  async function fetchCareers() {
    const r = await fetch("/api/careers");
    if (r.ok) setCareers(await r.json());
    setLoading(false);
  }

  async function createCareer(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const r = await fetch("/api/careers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (r.ok) {
      const career = await r.json();
      router.push(`/career/${career.id}`);
    }
    setCreating(false);
  }

  async function deleteCareer(id: string) {
    if (!confirm("Delete this career?")) return;
    await fetch(`/api/careers?id=${id}`, { method: "DELETE" });
    setCareers((c) => c.filter((x) => x.id !== id));
  }

  const inp: React.CSSProperties = { width: "100%", background: "#080B14", border: "1px solid rgba(0, 255, 65, 0.1)", color: C.text, borderRadius: 8, padding: "10px 14px", fontSize: 14, transition: "all 0.2s" };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto", animation: "fadeIn 0.4s ease-out" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, animation: "slideUp 0.5s ease-out" }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, background: "linear-gradient(135deg, #00FF41, #EC1C24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>My Careers</h1>
            <p style={{ color: C.textSec, marginTop: 6, fontSize: 14 }}>Upload a save to get started</p>
          </div>
          <button onClick={() => setShowNew(true)} style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            background: "linear-gradient(135deg, #00FF41, #00D93D)",
            border: "none",
            borderRadius: 10,
            color: "#0A0D1A",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.3s",
            boxShadow: "0 0 15px rgba(0, 255, 65, 0.2)"
          }} onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 0 25px rgba(0, 255, 65, 0.4)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }} onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 0 15px rgba(0, 255, 65, 0.2)";
            e.currentTarget.style.transform = "translateY(0)";
          }}>
            <Plus size={16} /> New Career
          </button>
        </div>

        {loading ? (
          <GridSkeleton count={6} />
        ) : careers.length === 0 ? (
          <EmptyState onNew={() => setShowNew(true)} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {careers.map((c, idx) => (
              <div
                key={c.id}
                style={{
                  background: C.card,
                  border: `1px solid rgba(0, 255, 65, 0.1)`,
                  borderRadius: 12,
                  padding: 20,
                  cursor: "pointer",
                  position: "relative",
                  animation: `slideUp 0.5s ease-out ${0.1 + idx * 0.05}s both`,
                  transition: "all 0.3s"
                }}
                onClick={() => router.push(`/career/${c.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 255, 65, 0.3)";
                  e.currentTarget.style.boxShadow = "0 0 15px rgba(0, 255, 65, 0.2)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 255, 65, 0.1)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #00FF41, #EC1C24)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 900,
                    color: "#0A0D1A"
                  }}>★</div>
                  <button onClick={(e) => { e.stopPropagation(); deleteCareer(c.id); }}
                    style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", padding: 4, transition: "all 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = C.red}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#64748B"}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{c.career_name}</div>
                <div style={{ fontSize: 13, color: C.textSec }}>{c.club_name ?? "No club"} · {c.league ?? "No league"}</div>
                <div style={{ marginTop: 10, fontSize: 12, color: "#4A556B" }}>Season {c.season ?? "—"} · {c.difficulty ?? "—"}</div>
              </div>
            ))}
          </div>
        )}

        {/* New career modal */}
        {showNew && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, animation: "fadeIn 0.3s ease-out", backdropFilter: "blur(4px)" }}>
            <div style={{ background: C.card, border: `1px solid rgba(0, 255, 65, 0.2)`, borderRadius: 16, padding: 32, width: 400, animation: "slideUp 0.4s ease-out", boxShadow: "0 0 30px rgba(0, 255, 65, 0.15)" }}>
              <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 800, color: "transparent", background: "linear-gradient(135deg, #00FF41, #EC1C24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>New Career</h2>
              <form onSubmit={createCareer} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {([["career_name","Career name *"],["club_name","Club"],["league","League"],["season","Season (e.g. 2024/25)"]] as [keyof typeof form, string][]).map(([k,l]) => (
                  <div key={k}>
                    <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 5 }}>{l}</label>
                    <input value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} style={inp} required={k === "career_name"} onFocus={(e) => e.currentTarget.style.borderColor = "rgba(0, 255, 65, 0.3)"} onBlur={(e) => e.currentTarget.style.borderColor = "rgba(0, 255, 65, 0.1)"} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 5 }}>Difficulty</label>
                  <select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))} style={inp}>
                    {["Amateur","Semi-Pro","Professional","World Class","Legendary","Ultimate"].map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => setShowNew(false)} style={{ flex: 1, padding: "11px", borderRadius: 8, background: "none", border: "1px solid rgba(0, 255, 65, 0.1)", color: C.textSec, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(0, 255, 65, 0.3)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(0, 255, 65, 0.1)"}>Cancel</button>
                  <button type="submit" disabled={creating} style={{ flex: 1, padding: "11px", borderRadius: 8, background: "linear-gradient(135deg, #00FF41, #00D93D)", color: "#0A0D1A", border: "none", fontWeight: 700, cursor: "pointer", transition: "all 0.3s", boxShadow: "0 0 15px rgba(0, 255, 65, 0.2)", opacity: creating ? 0.7 : 1 }} onMouseEnter={(e) => !creating && (e.currentTarget.style.boxShadow = "0 0 25px rgba(0, 255, 65, 0.4)")} onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 0 15px rgba(0, 255, 65, 0.2)"}>
                    {creating ? "Creating…" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", animation: "slideUp 0.6s ease-out" }}>
      <div style={{ fontSize: 48, marginBottom: 16, animation: "pulse 2s ease-in-out infinite" }}>🎯</div>
      <h2 style={{ fontWeight: 800, marginBottom: 10, background: "linear-gradient(135deg, #00FF41, #EC1C24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>No careers yet</h2>
      <p style={{ color: "#64748B", marginBottom: 24 }}>Create a career and upload your FC save file to get started</p>
      <button onClick={onNew} style={{
        padding: "12px 28px",
        borderRadius: 10,
        background: "linear-gradient(135deg, #00FF41, #00D93D)",
        color: "#0A0D1A",
        border: "none",
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.3s",
        boxShadow: "0 0 15px rgba(0, 255, 65, 0.2)"
      }} onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 0 25px rgba(0, 255, 65, 0.4)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }} onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 0 15px rgba(0, 255, 65, 0.2)";
        e.currentTarget.style.transform = "translateY(0)";
      }}>
        <Plus size={16} style={{ display: "inline", marginRight: 8 }} />Create Career
      </button>
    </div>
  );
}
