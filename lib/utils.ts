import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `€${(amount / 1_000).toFixed(0)}K`;
  return `€${amount}`;
}

export function getOvrColor(ovr: number): string {
  if (ovr >= 85) return "#F59E0B";
  if (ovr >= 75) return "#22C55E";
  if (ovr >= 65) return "#06B6D4";
  return "#94A3B8";
}

export function getPositionColor(pos: string): string {
  const p = pos?.toUpperCase();
  if (["ST","CF","LW","RW","LF","RF"].includes(p)) return "#EF4444";
  if (["CAM","CM","CDM","LM","RM"].includes(p)) return "#F59E0B";
  if (["CB","LB","RB","LWB","RWB"].includes(p)) return "#3B82F6";
  if (p === "GK") return "#22C55E";
  return "#94A3B8";
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
