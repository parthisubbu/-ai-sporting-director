"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { createClient } from "@/lib/supabase/client";
import { User, Brain, Bell, Shield } from "lucide-react";

const C = { card: "#0E1325", border: "rgba(255,255,255,0.055)", teal: "#06B6D4", text: "#F1F5F9", textSec: "#94A3B8" };

export default function SettingsPage() {
  const router   = useRouter();
  const supabase = createClient();
  const [email, setEmail]           = useState("");
  const [displayName, setDisplay]   = useState("");
  const [aiModel, setAiModel]       = useState("");
  const [notifications, setNotifs]  = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [tab, setTab]               = useState<"profile" | "ai" | "notifications" | "account">("profile");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setEmail(user.email ?? "");
      setDisplay((user.user_metadata?.display_name as string) ?? "");
      setAiModel((user.user_metadata?.ai_model as string) ?? "");
    });
  }, []);

  async function save() {
    setSaving(true);
    await supabase.auth.updateUser({ data: { display_name: displayName, ai_model: aiModel } });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function changePassword() {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback`,
    });
    alert("Password reset email sent.");
  }

  async function deleteAccount() {
    if (!confirm("Delete your account? This cannot be undone.")) return;
    await supabase.auth.signOut();
    router.push("/login");
  }

  const inp: React.CSSProperties = {
    background: "#080B14", border: `1px solid ${C.border}`, color: C.text,
    borderRadius: 8, padding: "9px 12px", fontSize: 13, width: "100%",
  };

  const tabs = [
    { key: "profile",       icon: User,   label: "Profile"        },
    { key: "ai",            icon: Brain,  label: "AI Preferences" },
    { key: "notifications", icon: Bell,   label: "Notifications"  },
    { key: "account",       icon: Shield, label: "Account"        },
  ] as const;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Side tabs */}
        <div style={{ width: 220, borderRight: `1px solid ${C.border}`, padding: 16, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Settings</div>
          {tabs.map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "9px 12px", borderRadius: 8, marginBottom: 2,
              background: tab === key ? "rgba(6,182,212,0.1)" : "transparent",
              color: tab === key ? C.teal : C.textSec,
              border: "none", cursor: "pointer", fontSize: 13,
              fontWeight: tab === key ? 700 : 400, textAlign: "left",
            }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 40, overflowY: "auto", maxWidth: 560 }}>

          {tab === "profile" && (
            <>
              <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 800 }}>Profile</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 6 }}>Email</label>
                <input value={email} disabled style={{ ...inp, opacity: 0.5 }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 6 }}>Display Name</label>
                <input value={displayName} onChange={(e) => setDisplay(e.target.value)} style={inp} placeholder="Your name" />
              </div>
              <button onClick={save} disabled={saving} style={{
                padding: "10px 24px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                background: "rgba(6,182,212,0.15)", color: C.teal, border: `1px solid ${C.teal}`,
              }}>
                {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
              </button>
            </>
          )}

          {tab === "ai" && (
            <>
              <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 800 }}>AI Preferences</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 6 }}>Preferred Model</label>
                <input value={aiModel} onChange={(e) => setAiModel(e.target.value)}
                  style={inp} placeholder="e.g. mistralai/Mixtral-8x7B-Instruct-v0.1" />
                <div style={{ fontSize: 11, color: C.textSec, marginTop: 6 }}>Override the default model for AI reports and chat.</div>
              </div>
              <button onClick={save} disabled={saving} style={{
                padding: "10px 24px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                background: "rgba(6,182,212,0.15)", color: C.teal, border: `1px solid ${C.teal}`,
              }}>
                {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
              </button>
            </>
          )}

          {tab === "notifications" && (
            <>
              <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 800 }}>Notifications</h2>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Report Ready</div>
                  <div style={{ fontSize: 12, color: C.textSec }}>Notify when AI reports finish generating</div>
                </div>
                <button onClick={() => setNotifs((v) => !v)} style={{
                  width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
                  background: notifications ? C.teal : C.border, transition: "background 0.2s", position: "relative",
                }}>
                  <span style={{
                    position: "absolute", top: 3, left: notifications ? 20 : 3,
                    width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s",
                  }} />
                </button>
              </div>
            </>
          )}

          {tab === "account" && (
            <>
              <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 800 }}>Account</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button onClick={changePassword} style={{
                  padding: "10px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                  background: "#080B14", color: C.text, border: `1px solid ${C.border}`,
                }}>
                  Change Password
                </button>
                <button onClick={deleteAccount} style={{
                  padding: "10px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                  background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)",
                }}>
                  Delete Account
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
