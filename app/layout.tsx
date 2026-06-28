import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Sporting Director",
  description: "Elite football career intelligence powered by AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body style={{ background: "#0A0D1A", color: "#F1F5F9", margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
