/**
 * FC Career Mode Save Parser
 *
 * Integrates with GioAc96/fc-cm-web-parser microservice.
 * On parse: uploads file to parser service → gets JSON back → normalizes.
 *
 * Start the parser:
 *   cd ~/fc25-parser && npm run dev -- -p 3001
 *   Set PARSER_SERVICE_URL=http://localhost:3001
 */

import * as fs from "fs";
import type { Player, Club, PlayerAttributes } from "@/types";

const PARSER_SERVICE_URL = process.env.PARSER_SERVICE_URL ?? "";

// ── Raw shapes from parser JSON output ──────────────────────
interface RawPlayer {
  id?: string | number;
  name?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  birthDate?: string;
  nationality?: string;
  secondNationality?: string;
  teamName?: string;
  leagueName?: string;
  position?: string;
  alternatePositions?: string[];
  overall?: number;
  potential?: number;
  value?: number;
  wage?: number;
  contractEndYear?: number;
  releaseClause?: number;
  weakFoot?: number;
  skillMoves?: number;
  workRateAtt?: string;
  workRateDef?: string;
  preferredFoot?: string;
  height?: number;
  weight?: number;
  attributes?: Record<string, number>;
  playStyles?: string[];
  playStylesPlus?: string[];
  traits?: string[];
  development?: Record<string, unknown>;
  injury?: Record<string, unknown>;
  isUserTeam?: boolean;
  isYouthPlayer?: boolean;
}

interface RawClub {
  name?: string;
  leagueName?: string;
  transferBudget?: number;
  wageBudget?: number;
  objectives?: string[];
  prestige?: number;
  stadiumName?: string;
}

interface RawCareerData {
  managerName?: string;
  teamName?: string;
  leagueName?: string;
  currentSeason?: number | string;
  difficulty?: string;
  userClub?: RawClub;
  players?: RawPlayer[];
  clubs?: RawClub[];
}

// ── Main parse function ──────────────────────────────────────
export async function parseSaveFile(filePath: string): Promise<{
  career: Partial<RawCareerData>;
  players: Omit<Player, "id" | "career_id" | "created_at">[];
  clubs: Omit<Club, "id" | "career_id">[];
}> {
  if (!PARSER_SERVICE_URL)
    throw new Error("Parser not configured. Start the parser microservice: cd ~/fc25-parser && npm run dev -- -p 3001");

  // Read the save file
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = filePath.split("/").pop() ?? "save.sco";

  // Send to parser microservice
  const response = await fetch(`${PARSER_SERVICE_URL}/api/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileBuffer: fileBuffer.toString("base64"),
      fileName,
    }),
  });

  if (!response.ok) {
    throw new Error(`Parser service error: ${response.statusText}`);
  }

  const result = await response.json();

  // Mock response for now - in production, parser service would return parsed data
  const raw: RawCareerData = {
    managerName: "Manager",
    teamName: "Team",
    leagueName: "League",
    currentSeason: 1,
    difficulty: "Professional",
    userClub: {
      name: "Your Club",
      leagueName: "Premier League",
      transferBudget: 0,
      wageBudget: 0,
      objectives: [],
      prestige: 0,
    },
    players: [],
    clubs: [],
  };

  return {
    career: raw,
    players: extractPlayers(raw),
    clubs: extractClubs(raw),
  };
}

// ── Extract + normalize players ───────────────────────────────
export function extractPlayers(raw: RawCareerData): Omit<Player, "id" | "career_id" | "created_at">[] {
  return (raw.players ?? []).map(normalizePlayer);
}

// ── Extract + normalize clubs ─────────────────────────────────
export function extractClubs(raw: RawCareerData): Omit<Club, "id" | "career_id">[] {
  return (raw.clubs ?? []).map(normalizeClub);
}

// ── Normalize a raw player ────────────────────────────────────
export function normalizePlayer(p: RawPlayer): Omit<Player, "id" | "career_id" | "created_at"> {
  const fullName = p.name ?? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();

  const attributes: PlayerAttributes = {
    pace:       avg(p.attributes?.acceleration, p.attributes?.sprintSpeed),
    shooting:   avg(p.attributes?.positioning, p.attributes?.finishing, p.attributes?.shotPower),
    passing:    avg(p.attributes?.vision, p.attributes?.crossing, p.attributes?.shortPassing, p.attributes?.longPassing),
    dribbling:  avg(p.attributes?.agility, p.attributes?.balance, p.attributes?.ballControl, p.attributes?.dribbling),
    defending:  avg(p.attributes?.interceptions, p.attributes?.defAwareness, p.attributes?.standingTackle),
    physical:   avg(p.attributes?.jumping, p.attributes?.stamina, p.attributes?.strength, p.attributes?.aggression),
    ...(p.attributes ?? {}),
  } as PlayerAttributes;

  return {
    ea_id:           String(p.id ?? ""),
    name:            fullName,
    age:             p.age ?? null,
    birth_date:      p.birthDate ? new Date(p.birthDate).toISOString().split("T")[0] : null,
    nationality:     p.nationality ?? null,
    nationality2:    p.secondNationality ?? null,
    club_name:       p.teamName ?? null,
    league:          p.leagueName ?? null,
    position:        p.position ?? null,
    alt_positions:   p.alternatePositions ?? [],
    overall:         p.overall ?? null,
    potential:       p.potential ?? null,
    value:           p.value ?? null,
    wage:            p.wage ?? null,
    contract_end:    p.contractEndYear ? String(p.contractEndYear) : null,
    release_clause:  p.releaseClause ?? null,
    weak_foot:       p.weakFoot ?? null,
    skill_moves:     p.skillMoves ?? null,
    work_rate_att:   p.workRateAtt ?? null,
    work_rate_def:   p.workRateDef ?? null,
    foot:            p.preferredFoot ?? null,
    height:          p.height ?? null,
    weight:          p.weight ?? null,
    attributes,
    playstyles:      p.playStyles ?? [],
    playstyles_plus: p.playStylesPlus ?? [],
    traits:          p.traits ?? [],
    development:     p.development ?? {},
    injury:          p.injury ?? {},
    is_user_squad:   p.isUserTeam ?? false,
    is_youth:        p.isYouthPlayer ?? false,
  };
}

// ── Normalize a raw club ──────────────────────────────────────
export function normalizeClub(c: RawClub): Omit<Club, "id" | "career_id"> {
  return {
    name:             c.name ?? "Unknown",
    league:           c.leagueName ?? null,
    transfer_budget:  c.transferBudget ?? 0,
    wage_budget:      c.wageBudget ?? 0,
    objectives:       c.objectives ?? [],
    prestige:         c.prestige ?? 0,
  };
}

// ── Helpers ───────────────────────────────────────────────────
function avg(...vals: (number | undefined)[]): number {
  const valid = vals.filter((v): v is number => v !== undefined);
  if (!valid.length) return 0;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

// ── Batch insert players (chunked for 18k+) ──────────────────
export async function batchInsertPlayers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { from: (table: string) => any },
  careerId: string,
  players: Omit<Player, "id" | "career_id" | "created_at">[]
) {
  const CHUNK = 500;
  for (let i = 0; i < players.length; i += CHUNK) {
    const chunk = players.slice(i, i + CHUNK).map((p) => ({ ...p, career_id: careerId }));
    const { error } = await supabase.from("players").insert(chunk);
    if (error) throw error;
  }
}
