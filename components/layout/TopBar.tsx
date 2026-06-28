"use client";
import { Bell } from "lucide-react";
import type { Career } from "@/types";

const C = { border: "rgba(255,255,255,0.055)", accent: "#00FF41", text: "#F1F5F9", textSec: "#94A3B8" };

interface TopBarProps {
  career: Career | null;
  managerName?: string;
}

export default function TopBar({ career, managerName = "Manager" }: TopBarProps) {
  const clubInitial = career?.club_name?.charAt(0) ?? "C";

  return (
    <div style={{
      padding: "10px 24px",
      borderBottom: `1px solid ${C.border}`,
      display: "flex",
      alignItems: "center",
      background: "#080B14",
      gap: 16,
      flexShrink: 0,
      height: 56
    }}>
      {/* Club badge + career name */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #EC1C24, #8B0000)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 13, color: "#fff",
          flexShrink: 0
        }}>
          {clubInitial}
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#64748B", lineHeight: 1 }}>Career name</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text, lineHeight: 1.3 }}>
            {career?.career_name ?? "—"}
          </div>
        </div>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
        {/* Bell */}
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: 4, display: "flex", alignItems: "center" }}>
          <Bell size={15} />
        </button>

        {/* Manager avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #1a2236, #2d3f60)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: C.textSec, border: "1px solid rgba(255,255,255,0.1)"
          }}>
            {managerName.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 9, color: "#64748B", lineHeight: 1 }}>Manager</div>
            <div style={{ fontSize: 12, color: C.textSec, fontWeight: 600, lineHeight: 1.3 }}>{managerName}</div>
          </div>
        </div>

        {/* AI Status */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 20,
          background: "rgba(0, 255, 65, 0.08)",
          border: "1px solid rgba(0, 255, 65, 0.25)"
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%", background: C.accent,
            boxShadow: "0 0 6px rgba(0, 255, 65, 0.8)"
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>AI Status: Active</span>
        </div>
      </div>
    </div>
  );
}
