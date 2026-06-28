import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { batchInsertPlayers } from "@/services/parser";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const mockData = {
      managerName: "Test Manager",
      teamName: "Manchester United",
      leagueName: "Premier League",
      currentSeason: 1,
      difficulty: "Professional",
      userClub: {
        name: "Manchester United",
        leagueName: "Premier League",
        transferBudget: 150000000,
        wageBudget: 300000,
        objectives: ["Win the League", "Win FA Cup"],
        prestige: 95,
        stadiumName: "Old Trafford",
      },
      players: [
        {
          id: "1",
          name: "Harry Maguire",
          age: 31,
          birthDate: "1993-03-05",
          nationality: "England",
          teamName: "Manchester United",
          leagueName: "Premier League",
          position: "CB",
          alternatePositions: ["RCB", "LCB"],
          overall: 81,
          potential: 81,
          value: 45000000,
          wage: 190000,
          contractEndYear: 2026,
          weakFoot: 4,
          skillMoves: 1,
          workRateAtt: "Medium",
          workRateDef: "High",
          preferredFoot: "Right",
          height: 194,
          weight: 88,
          attributes: {
            pace: 68,
            shooting: 45,
            passing: 70,
            dribbling: 50,
            defending: 85,
            physical: 88,
          },
          playStyles: ["Block", "Slide Tackle"],
          playStylesPlus: ["Leadership"],
          isUserTeam: true,
          isYouthPlayer: false,
        },
        {
          id: "2",
          name: "Cristiano Ronaldo",
          age: 39,
          birthDate: "1985-02-05",
          nationality: "Portugal",
          teamName: "Al Nassr",
          leagueName: "Saudi Pro League",
          position: "ST",
          alternatePositions: ["LW", "RW"],
          overall: 87,
          potential: 87,
          value: 10000000,
          wage: 2500000,
          contractEndYear: 2025,
          weakFoot: 5,
          skillMoves: 5,
          workRateAtt: "High",
          workRateDef: "Low",
          preferredFoot: "Right",
          height: 187,
          weight: 83,
          attributes: {
            pace: 85,
            shooting: 94,
            passing: 82,
            dribbling: 88,
            defending: 35,
            physical: 89,
          },
          playStyles: ["Finesse Shot", "Power Shot"],
          playStylesPlus: ["Leadership"],
          isUserTeam: false,
          isYouthPlayer: false,
        },
      ],
      clubs: [
        {
          name: "Manchester United",
          leagueName: "Premier League",
          transferBudget: 150000000,
          wageBudget: 300000,
          objectives: ["Win the League", "Win FA Cup"],
          prestige: 95,
          stadiumName: "Old Transistor",
        },
      ],
    };

    // Create career from mock data
    const { data: career, error: careerError } = await supabase
      .from("careers")
      .insert({
        user_id: user.id,
        career_name: mockData.teamName,
        club_name: mockData.userClub.name,
        league: mockData.leagueName,
        season: String(mockData.currentSeason),
        difficulty: mockData.difficulty,
      })
      .select()
      .single();

    if (careerError) {
      return NextResponse.json({ error: careerError.message }, { status: 500 });
    }

    // Insert clubs
    const clubsToInsert = mockData.clubs.map((c) => ({
      career_id: career.id,
      name: c.name,
      league: c.leagueName,
      transfer_budget: c.transferBudget,
      wage_budget: c.wageBudget,
      objectives: c.objectives,
      prestige: c.prestige,
      stadium: c.stadiumName,
    }));

    const { error: clubsError } = await supabase.from("clubs").insert(clubsToInsert);
    if (clubsError) {
      return NextResponse.json({ error: clubsError.message }, { status: 500 });
    }

    // Insert players (using batch insert for 18k+ support)
    const playersToInsert = mockData.players.map((p) => ({
      ea_id: String(p.id),
      name: p.name,
      age: p.age,
      birth_date: p.birthDate,
      nationality: p.nationality,
      nationality2: p.secondNationality ?? null,
      club_name: p.teamName,
      league: p.leagueName,
      position: p.position,
      alt_positions: p.alternatePositions,
      overall: p.overall,
      potential: p.potential,
      value: p.value,
      wage: p.wage,
      contract_end: String(p.contractEndYear),
      release_clause: p.releaseClause ?? null,
      weak_foot: p.weakFoot,
      skill_moves: p.skillMoves,
      work_rate_att: p.workRateAtt,
      work_rate_def: p.workRateDef,
      foot: p.preferredFoot,
      height: p.height,
      weight: p.weight,
      attributes: p.attributes,
      playstyles: p.playStyles,
      playstyles_plus: p.playStylesPlus,
      traits: p.traits ?? [],
      development: p.development ?? {},
      injury: p.injury ?? {},
      is_user_squad: p.isUserTeam,
      is_youth: p.isYouthPlayer,
    }));

    await batchInsertPlayers(supabase, career.id, playersToInsert);

    return NextResponse.json(
      {
        success: true,
        message: "Mock save file uploaded and processed",
        career: {
          id: career.id,
          name: career.career_name,
          clubName: career.club_name,
        },
        stats: {
          playersInserted: playersToInsert.length,
          clubsInserted: clubsToInsert.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
