import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  createAIClient,
  generateSquadAnalysis,
  generateTransferTargets,
  generateTacticalAdvice,
  findRelevantPlayers,
  AIProviderError,
} from "@/services/ai";
import type { Career, Club } from "@/types";

export async function GET() {
  try {
    // Use admin client to bypass RLS
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get first career (or create test one)
    const { data: careers } = await adminClient
      .from("careers")
      .select("*")
      .limit(1);

    let career: Career;

    if (!careers || careers.length === 0) {
      // Use the test user ID
      const userId = "33f08119-b3eb-4d9d-8952-c1310888a07b";

      // Create test career (using admin to bypass RLS)
      const { data: newCareer, error: createError } = await adminClient
        .from("careers")
        .insert({
          user_id: userId,
          career_name: "Test Sporting Director Report",
          club_name: "Manchester United",
          league: "Premier League",
          season: "1",
          difficulty: "Professional",
        })
        .select()
        .single();

      if (createError || !newCareer) {
        console.error("Career creation error:", createError);
        return NextResponse.json(
          { error: `Failed to create test career: ${createError?.message}` },
          { status: 500 }
        );
      }

      career = newCareer as Career;
    } else {
      career = careers[0] as Career;
    }

    // Get user's club
    const { data: clubs } = await adminClient
      .from("clubs")
      .select("*")
      .eq("career_id", career.id)
      .limit(1);

    const userClub = (clubs?.[0] ?? null) as Club | null;

    // Get squad
    const { data: squadData } = await adminClient
      .from("players")
      .select("*")
      .eq("career_id", career.id)
      .eq("is_user_squad", true)
      .order("overall", { ascending: false });

    let squadPlayers = squadData ?? [];

    console.log("📋 Test Report Generation");
    console.log("========================");
    console.log(`Career: ${career.career_name}`);
    console.log(`Club: ${career.club_name} (${career.league})`);
    console.log(`Squad Players: ${squadPlayers.length}`);

    // If no squad, create test data
    if (squadPlayers.length === 0) {
      console.log("📥 Creating test squad data...");

      const testPlayers = [
        {
          ea_id: "1",
          name: "Harry Maguire",
          age: 31,
          birth_date: "1993-03-05",
          nationality: "England",
          nationality2: null,
          club_name: "Manchester United",
          league: "Premier League",
          position: "CB",
          alt_positions: ["RCB", "LCB"],
          overall: 81,
          potential: 81,
          value: 45000000,
          wage: 190000,
          contract_end: "2026",
          release_clause: null,
          weak_foot: 4,
          skill_moves: 1,
          work_rate_att: "Medium",
          work_rate_def: "High",
          foot: "Right",
          height: 194,
          weight: 88,
          attributes: { pace: 68, shooting: 45, passing: 70, dribbling: 50, defending: 85, physical: 88 },
          playstyles: ["Block", "Slide Tackle"],
          playstyles_plus: ["Leadership"],
          traits: [],
          development: {},
          injury: {},
          is_user_squad: true,
          is_youth: false,
        },
        {
          ea_id: "2",
          name: "Alejandro Garnacho",
          age: 20,
          birth_date: "2004-07-01",
          nationality: "Argentina",
          nationality2: "Spain",
          club_name: "Manchester United",
          league: "Premier League",
          position: "LW",
          alt_positions: ["LM", "LF"],
          overall: 79,
          potential: 90,
          value: 75000000,
          wage: 120000,
          contract_end: "2028",
          release_clause: null,
          weak_foot: 3,
          skill_moves: 4,
          work_rate_att: "High",
          work_rate_def: "Medium",
          foot: "Left",
          height: 180,
          weight: 76,
          attributes: { pace: 89, shooting: 76, passing: 74, dribbling: 84, defending: 38, physical: 78 },
          playstyles: ["Pace", "Dribbling"],
          playstyles_plus: [],
          traits: [],
          development: {},
          injury: {},
          is_user_squad: true,
          is_youth: false,
        },
        {
          ea_id: "3",
          name: "Bruno Fernandes",
          age: 29,
          birth_date: "1994-09-30",
          nationality: "Portugal",
          nationality2: null,
          club_name: "Manchester United",
          league: "Premier League",
          position: "CAM",
          alt_positions: ["CM", "RW"],
          overall: 88,
          potential: 88,
          value: 120000000,
          wage: 290000,
          contract_end: "2026",
          release_clause: null,
          weak_foot: 4,
          skill_moves: 5,
          work_rate_att: "High",
          work_rate_def: "High",
          foot: "Right",
          height: 179,
          weight: 80,
          attributes: { pace: 81, shooting: 85, passing: 93, dribbling: 87, defending: 70, physical: 83 },
          playstyles: ["Playmaking", "Vision"],
          playstyles_plus: ["Leadership"],
          traits: [],
          development: {},
          injury: {},
          is_user_squad: true,
          is_youth: false,
        },
        {
          ea_id: "4",
          name: "Lisandro Martinez",
          age: 25,
          birth_date: "1998-01-18",
          nationality: "Argentina",
          nationality2: null,
          club_name: "Manchester United",
          league: "Premier League",
          position: "CB",
          alt_positions: ["LB", "CDM"],
          overall: 82,
          potential: 86,
          value: 65000000,
          wage: 180000,
          contract_end: "2027",
          release_clause: null,
          weak_foot: 3,
          skill_moves: 1,
          work_rate_att: "Medium",
          work_rate_def: "High",
          foot: "Right",
          height: 175,
          weight: 78,
          attributes: { pace: 75, shooting: 42, passing: 75, dribbling: 68, defending: 84, physical: 81 },
          playstyles: ["Tackling", "Interception"],
          playstyles_plus: [],
          traits: [],
          development: {},
          injury: {},
          is_user_squad: true,
          is_youth: false,
        },
        {
          ea_id: "5",
          name: "David de Gea",
          age: 33,
          birth_date: "1990-11-03",
          nationality: "Spain",
          nationality2: null,
          club_name: "Manchester United",
          league: "Premier League",
          position: "GK",
          alt_positions: [],
          overall: 82,
          potential: 82,
          value: 15000000,
          wage: 320000,
          contract_end: "2025",
          release_clause: null,
          weak_foot: 1,
          skill_moves: 1,
          work_rate_att: "Low",
          work_rate_def: "High",
          foot: "Right",
          height: 192,
          weight: 76,
          attributes: { pace: 20, shooting: 15, passing: 62, dribbling: 20, defending: 88, physical: 75 },
          playstyles: [],
          playstyles_plus: [],
          traits: [],
          development: {},
          injury: {},
          is_user_squad: true,
          is_youth: false,
        },
      ];

      const { error: playerError } = await adminClient
        .from("players")
        .insert(testPlayers.map((p) => ({ ...p, career_id: career.id })));

      if (playerError) {
        console.error("Player insert error:", playerError);
      } else {
        console.log(`✅ Created ${testPlayers.length} test players`);
        squadPlayers = testPlayers;
      }
    }

    console.log("");

    // Initialize AI
    console.log("🤖 Initializing AI provider...");
    const ai = createAIClient();

    // Generate reports
    console.log("📊 Generating Squad Analysis...");
    const startTime = Date.now();

    const { report: squadReport, analysis } = await generateSquadAnalysis(ai, {
      career,
      userClub,
      squadPlayers,
    });

    console.log(`✅ Squad Analysis (${Date.now() - startTime}ms)`);

    console.log("🎯 Generating Transfer Targets...");
    const targetStartTime = Date.now();

    const targets = await findRelevantPlayers(adminClient as any, career.id, {
      minPotential: 75,
      maxAge: 28,
      maxValue: userClub?.transfer_budget ?? 100_000_000,
      isSquad: false,
      limit: 20,
    });

    const transferReport = await generateTransferTargets(
      ai,
      { career, userClub, squadPlayers, topTargets: targets },
      userClub?.transfer_budget ?? 0
    );

    console.log(`✅ Transfer Targets (${Date.now() - targetStartTime}ms)`);

    console.log("⚽ Generating Tactical Advice...");
    const tacticalStartTime = Date.now();

    const tacticalReport = await generateTacticalAdvice(ai, {
      career,
      userClub,
      squadPlayers,
    });

    console.log(`✅ Tactical Advice (${Date.now() - tacticalStartTime}ms)`);

    // Combine into full report
    const fullReport = `# 🏆 SPORTING DIRECTOR REPORT
## ${career.career_name} - ${career.season}

---

## 📊 SQUAD ANALYSIS

${squadReport}

---

## 🎯 TRANSFER RECOMMENDATIONS

${transferReport}

---

## ⚽ TACTICAL BLUEPRINT

${tacticalReport}

---

**Report Generated:** ${new Date().toISOString()}
**Provider:** Groq Cloud (llama-3.1-70b-versatile)
`;

    // Save to database
    console.log("💾 Saving report to database...");

    const { data: reportData, error: reportError } = await adminClient
      .from("reports")
      .insert({
        career_id: career.id,
        type: "full",
        title: `Full Sporting Director Report - ${career.season}`,
        content: fullReport,
      })
      .select()
      .single();

    if (reportError) {
      console.error("❌ Database error:", reportError);
      return NextResponse.json(
        { error: `Failed to save report: ${reportError.message}` },
        { status: 500 }
      );
    }

    console.log("✅ Report saved successfully");
    console.log("");
    console.log("✨ TEST COMPLETE - SUCCESS");

    return NextResponse.json(
      {
        success: true,
        career: {
          id: career.id,
          name: career.career_name,
          club: career.club_name,
          league: career.league,
          season: career.season,
        },
        stats: {
          squadPlayers: squadPlayers.length,
          availableTargets: targets.length,
          reportLength: fullReport.length,
        },
        report: {
          id: reportData?.id,
          title: reportData?.title,
          content: fullReport,
        },
        timing: {
          total: Date.now() - startTime,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error:", error);

    // Handle AI provider errors
    if (error instanceof AIProviderError) {
      return NextResponse.json(
        {
          error: `AI Provider Error [${error.code}]: ${error.message}`,
          code: error.code,
          details: error.originalError?.message,
        },
        { status: error.code === "MISSING_KEY" ? 400 : 503 }
      );
    }

    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
