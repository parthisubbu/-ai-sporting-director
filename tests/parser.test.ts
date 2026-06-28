import { normalizePlayer, extractPlayers } from "../services/parser";

// ── Parser tests ──────────────────────────────────────────────
describe("Parser", () => {
  it("normalizePlayer: handles full player object", () => {
    const raw = {
      id: "123", name: "Test Player", age: 22,
      nationality: "England", teamName: "Arsenal", leagueName: "Premier League",
      position: "CM", overall: 78, potential: 86, value: 25_000_000, wage: 50_000,
      contractEndYear: 2026, weakFoot: 3, skillMoves: 3,
      workRateAtt: "High", workRateDef: "Medium", preferredFoot: "Right",
      attributes: { acceleration: 75, sprintSpeed: 72, vision: 78, shortPassing: 82 },
      playStyles: ["Technical"], playStylesPlus: [], traits: [], isUserTeam: true, isYouthPlayer: false,
    };
    const p = normalizePlayer(raw);
    expect(p.name).toBe("Test Player");
    expect(p.overall).toBe(78);
    expect(p.potential).toBe(86);
    expect(p.is_user_squad).toBe(true);
    expect(p.attributes.passing).toBeGreaterThan(0);
  });

  it("normalizePlayer: handles missing fields gracefully", () => {
    const p = normalizePlayer({ name: "John Doe" });
    expect(p.name).toBe("John Doe");
    expect(p.overall).toBeNull();
    expect(p.alt_positions).toEqual([]);
    expect(p.playstyles).toEqual([]);
  });

  it("extractPlayers: returns empty array for no players", () => {
    const result = extractPlayers({ players: [] });
    expect(result).toEqual([]);
  });

  it("extractPlayers: processes multiple players", () => {
    const raw = {
      players: [
        { name: "Player 1", overall: 80 },
        { name: "Player 2", overall: 75 },
      ],
    };
    const result = extractPlayers(raw);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Player 1");
    expect(result[1].overall).toBe(75);
  });

  it("normalizePlayer: computes attribute averages", () => {
    const raw = {
      name: "Test",
      attributes: { acceleration: 80, sprintSpeed: 90 },
    };
    const p = normalizePlayer(raw);
    expect(p.attributes.pace).toBe(85); // avg(80,90)
  });
});

// ── Utility tests ─────────────────────────────────────────────
describe("Utilities", () => {
  const { formatCurrency, getOvrColor, getPositionColor } = require("../lib/utils");

  it("formatCurrency: millions", () => expect(formatCurrency(25_000_000)).toBe("€25.0M"));
  it("formatCurrency: thousands", () => expect(formatCurrency(500_000)).toBe("€500K"));
  it("formatCurrency: small", () => expect(formatCurrency(100)).toBe("€100"));

  it("getOvrColor: gold for 85+", () => expect(getOvrColor(90)).toBe("#F59E0B"));
  it("getOvrColor: green for 75-84", () => expect(getOvrColor(78)).toBe("#22C55E"));
  it("getOvrColor: teal for 65-74", () => expect(getOvrColor(68)).toBe("#06B6D4"));
  it("getOvrColor: gray below 65", () => expect(getOvrColor(60)).toBe("#94A3B8"));

  it("getPositionColor: red for attackers", () => expect(getPositionColor("ST")).toBe("#EF4444"));
  it("getPositionColor: amber for midfielders", () => expect(getPositionColor("CM")).toBe("#F59E0B"));
  it("getPositionColor: blue for defenders", () => expect(getPositionColor("CB")).toBe("#3B82F6"));
  it("getPositionColor: green for GK", () => expect(getPositionColor("GK")).toBe("#22C55E"));
});
