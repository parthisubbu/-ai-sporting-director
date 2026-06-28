import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0D1A] relative overflow-hidden">
      {/* Animated gradient bg */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(circle at 20% 50%, rgba(0, 255, 65, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236, 28, 36, 0.05) 0%, transparent 50%)"
      }} />

      {/* Nav */}
      <nav className="px-10 py-5 flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] relative z-10 fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#EC1C24] to-[#00FF41] flex items-center justify-center text-white font-black text-sm">⚡</div>
          <span className="font-black text-lg text-[#F1F5F9]">AI Sporting Director</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="px-5 py-2 rounded-lg border border-[rgba(255,255,255,0.12)] text-[#94A3B8] text-sm hover:border-[rgba(0,255,65,0.3)] transition-all">Sign in</Link>
          <Link href="/signup" className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#00FF41] to-[#00D93D] text-[#0A0D1A] text-sm font-bold hover:shadow-lg hover:shadow-[rgba(0,255,65,0.3)] transition-all">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 pt-20 pb-20 text-center relative z-5">
        <div className="text-xs font-black tracking-widest text-[#00FF41] mb-5 uppercase slide-up">FC Career Mode Intelligence</div>

        <h1 className="text-3xl md:text-6xl font-black leading-tight mb-6 max-w-3xl slide-up" style={{ animationDelay: "0.1s" }}>
          Your AI-Powered<br />
          <span className="bg-gradient-to-r from-[#00FF41] to-[#EC1C24] bg-clip-text text-transparent">Sporting Director</span>
        </h1>

        <p className="text-lg text-[#94A3B8] max-w-2xl leading-relaxed mb-10 slide-up" style={{ animationDelay: "0.2s" }}>
          Upload your Career Mode save. Get elite transfer recommendations, squad analysis, and tactical advice — powered by AI trained to think like a Director of Football.
        </p>

        <Link href="/signup" className="px-10 py-4 rounded-xl bg-gradient-to-r from-[#00FF41] to-[#00D93D] text-[#0A0D1A] font-black text-lg hover:shadow-xl hover:shadow-[rgba(0,255,65,0.4)] hover:-translate-y-1 transition-all slide-up" style={{ animationDelay: "0.3s" }}>
          Start for free →
        </Link>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full mt-20">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="p-6 bg-[#0E1325] border border-[rgba(0,255,65,0.1)] rounded-lg hover:border-[rgba(0,255,65,0.3)] hover:shadow-lg hover:shadow-[rgba(0,255,65,0.15)] hover:-translate-y-1 transition-all slide-up cursor-pointer"
              style={{ animationDelay: `${0.4 + i * 0.05}s` }}
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="font-bold mb-2 text-[#F1F5F9]">{f.title}</div>
              <div className="text-sm text-[#64748B] leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-10 py-6 border-t border-[rgba(255,255,255,0.06)] text-center text-[#4A556B] text-sm relative z-5">
        AI Sporting Director — Not affiliated with EA Sports
      </footer>
    </div>
  );
}

const FEATURES = [
  { icon: "📊", title: "Squad Analysis", desc: "Full breakdown of your squad with scores for attack, midfield, defense, and depth." },
  { icon: "🎯", title: "Transfer Intelligence", desc: "AI-recommended targets filtered by budget, position need, and potential." },
  { icon: "⚙️", title: "Tactical Advice", desc: "Formation, roles, and instructions tailored to your specific players." },
  { icon: "📈", title: "Development Plans", desc: "Personalized growth paths for your youth and high-potential players." },
  { icon: "💬", title: "AI Director Chat", desc: "Ask anything — transfer decisions, team selection, season strategy." },
  { icon: "🔍", title: "Scouting Database", desc: "Search 18,000+ players from your save with advanced filters." },
];
