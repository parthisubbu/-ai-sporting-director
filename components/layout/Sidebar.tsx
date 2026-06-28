"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, FolderOpen, Users, Search,
  Bot, FileText, Settings, LogOut, Target, TrendingUp, BarChart2,
} from "lucide-react";

const C = { bg: "#080B14", border: "rgba(255,255,255,0.055)", accent: "#00FF41", text: "#F1F5F9", textSec: "#64748B" };

interface SidebarProps {
  careerId?: string;
}

export default function Sidebar({ careerId }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  const topItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ...(careerId ? [
      { href: `/career/${careerId}`,           icon: BarChart2,       label: "Overview"      },
      { href: `/career/${careerId}/players`,   icon: Users,           label: "Squad Analysis"},
      { href: `/career/${careerId}/scouting`,  icon: Search,          label: "Transfer Market"},
      { href: `/career/${careerId}/reports`,   icon: FileText,        label: "Reports"       },
      { href: `/career/${careerId}/tactics`,   icon: Target,          label: "Tactics"       },
      { href: `/career/${careerId}/chat`,      icon: Bot,             label: "AI Assistant"  },
    ] : []),
  ];

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: typeof LayoutDashboard; label: string }) => {
    // Exact path matching for each route
    const active = pathname === href;
    return (
      <Link
        href={href}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 11px", borderRadius: 8, textDecoration: "none",
          background: active ? "linear-gradient(135deg, rgba(0, 255, 65, 0.12), rgba(0, 255, 65, 0.06))" : "transparent",
          color: active ? C.accent : C.textSec,
          fontSize: 13, fontWeight: active ? 600 : 400,
          transition: "all 0.2s ease",
          border: active ? "1px solid rgba(0, 255, 65, 0.25)" : "1px solid transparent",
          position: "relative"
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = "rgba(0, 255, 65, 0.04)";
            e.currentTarget.style.borderColor = "rgba(0, 255, 65, 0.1)";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }
        }}
      >
        <Icon size={15} strokeWidth={1.5} style={{ opacity: active ? 1 : 0.7 }} />
        <span>{label}</span>
        {active && (
          <div style={{
            position: "absolute",
            left: 0, top: "50%", transform: "translateY(-50%)",
            width: 3, height: 20, background: C.accent,
            borderRadius: "0 2px 2px 0", boxShadow: "0 0 8px rgba(0,255,65,0.5)"
          }} />
        )}
      </Link>
    );
  };

  return (
    <div style={{
      width: 220,
      background: C.bg,
      borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column",
      flexShrink: 0, height: "100vh", position: "sticky", top: 0,
      overflowY: "auto"
    }}>
      {/* Logo */}
      <div style={{ padding: "18px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg, #EC1C24, #00FF41)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: "#0A0D1A", flexShrink: 0,
            boxShadow: "0 4px 12px rgba(236, 28, 36, 0.3)"
          }}>⚡</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 13, color: C.text, lineHeight: 1.2, letterSpacing: -0.3 }}>AI Sporting</div>
            <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.1, letterSpacing: -0.2 }}>Director</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {topItems.map(({ href, icon, label }) => (
          <NavLink key={href} href={href} icon={icon} label={label} />
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "12px 8px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
        <Link href="/settings" style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 11px", borderRadius: 8, textDecoration: "none",
          color: C.textSec, fontSize: 13, transition: "all 0.2s",
          border: "1px solid transparent"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(0, 255, 65, 0.04)";
          e.currentTarget.style.borderColor = "rgba(0, 255, 65, 0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "transparent";
        }}>
          <Settings size={15} strokeWidth={1.5} />
          Settings
        </Link>
        <button onClick={signOut} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 11px", borderRadius: 8,
          background: "none", border: "1px solid transparent", color: C.textSec,
          fontSize: 13, cursor: "pointer", width: "100%", transition: "all 0.2s"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(0, 255, 65, 0.04)";
          e.currentTarget.style.borderColor = "rgba(0, 255, 65, 0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "transparent";
        }}>
          <LogOut size={15} strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </div>
  );
}
