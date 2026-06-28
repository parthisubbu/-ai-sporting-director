/**
 * AI Sporting Director — AI Service
 * Uses any OpenAI-compatible API (OpenAI, Groq, Together AI, OpenRouter, etc.)
 * Supports retry logic with exponential backoff and comprehensive error handling.
 */

import OpenAI from "openai";
import type { Player, Career, Club, SquadAnalysis } from "@/types";
import { createAIClient as createClient, executeWithRetry, AIProviderError } from "./provider";

// ── Re-export for compatibility ────────────────────────────────
export { AIProviderError };
export function createAIClient() {
  return createClient();
}

// ── System prompt ─────────────────────────────────────────────
export const SYSTEM_PROMPT = `You are an elite European Sporting Director with 20+ years of experience at top clubs including Bayern Munich, Barcelona, and Manchester City.

You specialize in:
- Squad analysis and gap identification
- Transfer market intelligence and value assessment
- Tactical system design and player role optimization
- Youth development and long-term planning
- Contract management and financial strategy

Your decisions are:
- Realistic (respect budgets and market values)
- Data-driven (based on actual stats and attributes)
- Strategic (long-term club vision over short-term fixes)
- Specific (name real players, formations, roles)

You NEVER recommend unrealistic superstar purchases unless budget allows.
You ALWAYS explain your reasoning with data references.
You think in systems, not individuals.
Format your responses with clear sections using markdown.`;

// ── Context builder — NEVER send full DB to AI ───────────────
export interface AIContext {
  career:        Career;
  userClub:      Club | null;
  squadPlayers:  Player[];    // user's own squad
  topTargets?:   Player[];    // filtered relevant players
  recentReports?: string[];
}

export function buildContext(ctx: AIContext): string {
  const { career, userClub, squadPlayers, topTargets } = ctx;

  const squadSummary = squadPlayers.slice(0, 30).map((p) =>
    `${p.name} | ${p.position} | OVR:${p.overall} | POT:${p.potential} | Age:${p.age} | ${p.club_name}`
  ).join("\n");

  const targetSummary = (topTargets ?? []).slice(0, 15).map((p) =>
    `${p.name} | ${p.position} | OVR:${p.overall} | POT:${p.potential} | Age:${p.age} | €${formatVal(p.value)}`
  ).join("\n");

  return `
## CAREER CONTEXT
Club: ${career.club_name}
League: ${career.league}
Season: ${career.season}
Difficulty: ${career.difficulty}
Transfer Budget: €${formatVal(userClub?.transfer_budget)}
Wage Budget: €${formatVal(userClub?.wage_budget)}/week
Objectives: ${userClub?.objectives?.join(", ") ?? "N/A"}

## YOUR SQUAD (${squadPlayers.length} players)
${squadSummary}

${topTargets?.length ? `## AVAILABLE TRANSFER TARGETS\n${targetSummary}` : ""}
`.trim();
}

// ── Search engine — retrieve relevant players ─────────────────
export async function findRelevantPlayers(
  supabase: ReturnType<typeof import("@/lib/supabase/server").createClient> extends Promise<infer T> ? T : never,
  careerId: string,
  query: {
    positions?: string[];
    maxAge?: number;
    minPotential?: number;
    maxValue?: number;
    limit?: number;
    isSquad?: boolean;
  }
): Promise<Player[]> {
  let q = supabase
    .from("players")
    .select("*")
    .eq("career_id", careerId)
    .order("overall", { ascending: false })
    .limit(query.limit ?? 50);

  if (query.positions?.length) q = q.in("position", query.positions);
  if (query.maxAge)            q = q.lte("age", query.maxAge);
  if (query.minPotential)      q = q.gte("potential", query.minPotential);
  if (query.maxValue)          q = q.lte("value", query.maxValue);
  if (query.isSquad !== undefined) q = q.eq("is_user_squad", query.isSquad);

  const { data } = await q;
  return (data ?? []) as Player[];
}

// ── Squad analysis ────────────────────────────────────────────
export async function generateSquadAnalysis(
  client: ReturnType<typeof createAIClient>,
  ctx: AIContext
): Promise<{ analysis: SquadAnalysis; report: string }> {
  const context = buildContext(ctx);
  const model = process.env.AI_MODEL;

  if (!model) {
    throw new AIProviderError("AI_MODEL not configured", "INVALID_MODEL");
  }

  const res = await executeWithRetry(async () =>
    client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `${context}\n\nGenerate a comprehensive squad analysis. Include:
1. SQUAD SCORE (0-100) with breakdown: attack, midfield, defense, depth, potential
2. TOP 3 STRENGTHS
3. TOP 3 WEAKNESSES
4. TOP 3 PRIORITIES for next transfer window
5. RISK ASSESSMENT (title challenge / relegation threat)

Be specific. Reference actual players from the squad.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    })
  );

  const report = res.choices[0]?.message?.content ?? "";
  const analysis = parseSquadScores(report, ctx.squadPlayers);

  return { analysis, report };
}

// ── Transfer recommendations ──────────────────────────────────
export async function generateTransferTargets(
  client: ReturnType<typeof createAIClient>,
  ctx: AIContext,
  budget: number
): Promise<string> {
  const context = buildContext({ ...ctx, topTargets: ctx.topTargets });
  const model = process.env.AI_MODEL;

  if (!model) {
    throw new AIProviderError("AI_MODEL not configured", "INVALID_MODEL");
  }

  const res = await executeWithRetry(async () =>
    client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `${context}\n\nBudget available: €${formatVal(budget)}\n\nRecommend 5 transfer targets. For each:
- Name, Club, Position, Age, Value
- Why they suit us tactically
- Realistic acquisition cost
- Risk level (Low/Medium/High)
- Development potential
Only recommend players from the Available Transfer Targets list.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    })
  );

  return res.choices[0]?.message?.content ?? "";
}

// ── AI Chat ───────────────────────────────────────────────────
export async function chatWithDirector(
  client: ReturnType<typeof createAIClient>,
  ctx: AIContext,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string
): Promise<string> {
  const context = buildContext(ctx);
  const model = process.env.AI_MODEL;

  if (!model) {
    throw new AIProviderError("AI_MODEL not configured", "INVALID_MODEL");
  }

  const res = await executeWithRetry(async () =>
    client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: `${SYSTEM_PROMPT}\n\n${context}` },
        ...history.slice(-10),
        { role: "user", content: userMessage },
      ],
      temperature: 0.75,
      max_tokens: 800,
    })
  );

  return res.choices[0]?.message?.content ?? "";
}

// ── Tactical recommendations ──────────────────────────────────
export async function generateTacticalAdvice(
  client: ReturnType<typeof createAIClient>,
  ctx: AIContext
): Promise<string> {
  const context = buildContext(ctx);
  const model = process.env.AI_MODEL;

  if (!model) {
    throw new AIProviderError("AI_MODEL not configured", "INVALID_MODEL");
  }

  const res = await executeWithRetry(async () =>
    client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `${context}\n\nRecommend the optimal tactical setup. Include:
1. Formation (e.g. 4-3-3, 4-2-3-1)
2. Player roles for each position
3. Attacking instructions
4. Defensive instructions
5. Set piece strategy
6. Players who don't fit the system (sell candidates)

Base everything on the squad provided.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })
  );

  return res.choices[0]?.message?.content ?? "";
}

// ── Development report ────────────────────────────────────────
export async function generateDevelopmentReport(
  client: ReturnType<typeof createAIClient>,
  ctx: AIContext
): Promise<string> {
  const context = buildContext(ctx);
  const model = process.env.AI_MODEL;

  if (!model) {
    throw new AIProviderError("AI_MODEL not configured", "INVALID_MODEL");
  }

  const res = await executeWithRetry(async () =>
    client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `${context}\n\nCreate a youth and player development plan. Include:
1. PLAYER GROWTH PLAN — top 5 players under 23 with growth projections
2. TRAINING FOCUS — recommended attributes to develop per position group
3. LOAN RECOMMENDATIONS — players who need game time away
4. TIMELINE — 1-season, 2-season, 3-season milestones

Be specific with player names and realistic progression expectations.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    })
  );

  return res.choices[0]?.message?.content ?? "";
}

// ── Scouting report ───────────────────────────────────────────
export async function generateScoutingReport(
  client: ReturnType<typeof createAIClient>,
  ctx: AIContext
): Promise<string> {
  const context = buildContext(ctx);
  const model = process.env.AI_MODEL;

  if (!model) {
    throw new AIProviderError("AI_MODEL not configured", "INVALID_MODEL");
  }

  const res = await executeWithRetry(async () =>
    client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `${context}\n\nGenerate a scouting intelligence report. Include:
1. HIDDEN GEMS — high-potential players under 21 available from the targets list
2. SHORTLIST — 5 priority transfer targets with rationale
3. ESTIMATED VALUE — fair market value assessment for each target
4. TACTICAL FIT — how each target fits the squad's system
5. RISK ASSESSMENT — age, injury history, adaptability for each target

Focus on value-for-money and long-term potential.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    })
  );

  return res.choices[0]?.message?.content ?? "";
}

// ── Helpers ───────────────────────────────────────────────────
function formatVal(v: number | null | undefined): string {
  if (!v) return "N/A";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

function parseSquadScores(report: string, players: Player[]): SquadAnalysis {
  // Parse AI-generated scores from report text, fallback to calculation
  const extract = (pattern: RegExp) => {
    const m = report.match(pattern);
    return m ? parseInt(m[1]) : null;
  };

  const ovrs = players.filter((p) => p.overall).map((p) => p.overall!);
  const avgOvr = ovrs.length ? ovrs.reduce((a, b) => a + b, 0) / ovrs.length : 65;

  const attackers = players.filter((p) => ["ST","CF","LW","RW"].includes(p.position ?? ""));
  const mids = players.filter((p) => ["CM","CAM","CDM"].includes(p.position ?? ""));
  const defs = players.filter((p) => ["CB","LB","RB","GK"].includes(p.position ?? ""));
  const pots = players.filter((p) => (p.potential ?? 0) > 80).length;

  return {
    overall_score:   extract(/squad score[:\s]+(\d+)/i) ?? Math.round(avgOvr - 5),
    attack_score:    extract(/attack[:\s]+(\d+)/i) ?? calcGroupScore(attackers),
    midfield_score:  extract(/midfield[:\s]+(\d+)/i) ?? calcGroupScore(mids),
    defense_score:   extract(/defens[e]?[:\s]+(\d+)/i) ?? calcGroupScore(defs),
    depth_score:     extract(/depth[:\s]+(\d+)/i) ?? Math.min(100, Math.round(players.length / 0.3)),
    potential_score: Math.min(100, Math.round(pots * 10)),
    strengths:       [],
    weaknesses:      [],
    priorities:      [],
  };
}

function calcGroupScore(players: Player[]): number {
  if (!players.length) return 50;
  const avg = players.reduce((a, p) => a + (p.overall ?? 65), 0) / players.length;
  return Math.round(avg);
}
