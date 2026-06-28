import Link from "next/link";

export function AuthForm({ title, cta, loading, error, email, setEmail, password, setPassword, onSubmit, footer }: {
  title: string; cta: string; loading: boolean; error: string;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void; footer: React.ReactNode;
}) {
  const inp: React.CSSProperties = { width: "100%", background: "#0E1325", border: "1px solid rgba(255,255,255,0.1)", color: "#F1F5F9", borderRadius: 10, padding: "12px 16px", fontSize: 14, outline: "none" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0D1A" }}>
      <div style={{ width: 400, background: "#0E1325", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 40 }}>
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚽</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{title}</h1>
          <p style={{ color: "#64748B", fontSize: 14, marginTop: 8 }}>AI Sporting Director</p>
        </div>
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inp} placeholder="you@example.com" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inp} placeholder="••••••••" />
          </div>
          {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", color: "#EF4444", fontSize: 13 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ padding: "13px", borderRadius: 10, background: "linear-gradient(135deg,#06B6D4,#0284C7)", color: "#fff", border: "none", fontWeight: 700, fontSize: 15, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Loading…" : cta}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#64748B" }}>{footer}</p>
      </div>
    </div>
  );
}
