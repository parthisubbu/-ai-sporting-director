import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createAIClient,
  buildContext,
  generateSquadAnalysis,
  generateTransferTargets,
  generateTacticalAdvice,
  generateDevelopmentReport,
  generateScoutingReport,
  findRelevantPlayers,
  AIProviderError,
} from "@/services/ai";
import type { ReportType } from "@/types";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { career_id, type } = await req.json() as { career_id: string; type: ReportType };
  if (!career_id || !type) return NextResponse.json({ error: "career_id and type required" }, { status: 400 });

  // Verify ownership
  const { data: career } = await supabase
    .from("careers")
    .select("*")
    .eq("id", career_id)
    .eq("user_id", user.id)
    .single();

  if (!career) return NextResponse.json({ error: "Career not found" }, { status: 404 });

  const { data: clubs } = await supabase
    .from("clubs")
    .select("*")
    .eq("career_id", career_id)
    .limit(1);

  const userClub = clubs?.[0] ?? null;

  // Fetch squad
  const { data: squadData } = await supabase
    .from("players")
    .select("*")
    .eq("career_id", career_id)
    .eq("is_user_squad", true)
    .order("overall", { ascending: false });

  const squadPlayers = squadData ?? [];
  const ai = createAIClient();
  let content = "";
  let title = "";

  try {
    if (type === "squad") {
      const { report } = await generateSquadAnalysis(ai, { career, userClub, squadPlayers });
      content = report;
      title = "Squad Analysis Report";
    } else if (type === "transfer") {
      const targets = await findRelevantPlayers(supabase, career_id, {
        minPotential: 75, maxAge: 28,
        maxValue: userClub?.transfer_budget ?? 100_000_000,
        isSquad: false, limit: 30,
      });
      content = await generateTransferTargets(ai, { career, userClub, squadPlayers, topTargets: targets }, userClub?.transfer_budget ?? 0);
      title = "Transfer Window Recommendations";
    } else if (type === "tactical") {
      content = await generateTacticalAdvice(ai, { career, userClub, squadPlayers });
      title = "Tactical System Report";
    } else if (type === "development") {
      content = await generateDevelopmentReport(ai, { career, userClub, squadPlayers });
      title = "Player Development Report";
    } else if (type === "scouting") {
      const targets = await findRelevantPlayers(supabase, career_id, {
        maxAge: 21, minPotential: 70, isSquad: false, limit: 25,
      });
      content = await generateScoutingReport(ai, { career, userClub, squadPlayers, topTargets: targets });
      title = "Scouting Intelligence Report";
    } else if (type === "full") {
      // Full director's report — chain all three
      const [squad, tactical, transfers] = await Promise.all([
        generateSquadAnalysis(ai, { career, userClub, squadPlayers }),
        generateTacticalAdvice(ai, { career, userClub, squadPlayers }),
        (async () => {
          const targets = await findRelevantPlayers(supabase, career_id, { isSquad: false, limit: 20 });
          return generateTransferTargets(ai, { career, userClub, squadPlayers, topTargets: targets }, userClub?.transfer_budget ?? 0);
        })(),
      ]);
      content = `# SPORTING DIRECTOR REPORT\n\n## SQUAD ANALYSIS\n${squad.report}\n\n## TACTICAL BLUEPRINT\n${tactical}\n\n## TRANSFER RECOMMENDATIONS\n${transfers}`;
      title = "Full Sporting Director Report";
    }

    const { data: report, error } = await supabase
      .from("reports")
      .insert({ career_id, type, title, content })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(report, { status: 201 });
  } catch (err: unknown) {
    // Handle AI provider errors with appropriate status codes
    if (err instanceof AIProviderError) {
      const status =
        err.code === "MISSING_KEY" || err.code === "INVALID_MODEL" ? 400 : 503;
      console.error(`AI Provider Error [${err.code}]:`, err.message);
      return NextResponse.json(
        {
          error: `AI Provider Error: ${err.message}`,
          code: err.code,
          details: process.env.NODE_ENV === "development" ? err.originalError?.message : undefined,
        },
        { status }
      );
    }

    const msg = err instanceof Error ? err.message : String(err);
    console.error("Report generation error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const career_id = new URL(req.url).searchParams.get("career_id");
  if (!career_id) return NextResponse.json({ error: "career_id required" }, { status: 400 });

  const { data: career } = await supabase
    .from("careers").select("id").eq("id", career_id).eq("user_id", user.id).single();
  if (!career) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data } = await supabase
    .from("reports")
    .select("*")
    .eq("career_id", career_id)
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}
