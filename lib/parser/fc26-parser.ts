/**
 * FC 26 Career Mode Save Parser
 * Simulates parsing of FC 26 .sco save files
 * Generates realistic player database from save file metadata
 */

export interface ParsedCareerData {
  career: CareerInfo;
  managers: ManagerInfo[];
  club: ClubInfo;
  squad: PlayerData[];
  league: LeagueInfo;
  season: number;
  difficulty: string;
  metadata: {
    fileSize: number;
    parseTime: number;
    playersExtracted: number;
    version: string;
  };
}

export interface CareerInfo {
  id: string;
  name: string;
  managerName: string;
  clubName: string;
  league: string;
  season: number;
  difficulty: string;
  startDate: string;
  lastModified: string;
  currency: string;
}

export interface ManagerInfo {
  id: string;
  name: string;
  nationality: string;
  age: number;
  joinDate: string;
}

export interface ClubInfo {
  id: string;
  name: string;
  league: string;
  country: string;
  stadium: string;
  founded: number;
  badge: string;
  transferBudget: number;
  wageBudget: number;
  objectivesRating: number;
  objectives: string[];
  prestige: number;
  reputation: number;
}

export interface LeagueInfo {
  id: string;
  name: string;
  country: string;
  teams: number;
}

export interface PlayerData {
  id: string;
  eaId: string;
  name: string;
  firstName: string;
  lastName: string;
  age: number;
  birthDate: string;
  nationality: string;
  secondNationality?: string;
  club: string;
  league: string;
  position: string;
  alternatePositions: string[];
  shirt: number;
  overall: number;
  potential: number;
  value: number;
  wage: number;
  contractEnd: number;
  contractStatus: string;
  releaseClause: number;
  preferredFoot: string;
  weakFoot: number;
  skillMoves: number;
  workRateAttacking: string;
  workRateDefending: string;
  height: number;
  weight: number;
  attributes: PlayerAttributes;
  traits: string[];
  playstyles: string[];
  playStylesPlus: string[];
  injury?: {
    type: string;
    duration: number;
  };
  loaned: boolean;
  loanedFrom?: string;
  isYouth: boolean;
  isCustom: boolean;
  development: {
    growthRate: number;
    proneToInjury: boolean;
    formBonus: number;
  };
}

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
  // Individual attributes
  acceleration?: number;
  sprintSpeed?: number;
  positioning?: number;
  finishing?: number;
  shotPower?: number;
  longShots?: number;
  volleys?: number;
  crossing?: number;
  shortPassing?: number;
  longPassing?: number;
  vision?: number;
  dribbling_attr?: number;
  ballControl?: number;
  agility?: number;
  balance?: number;
  reactions?: number;
  headingAccuracy?: number;
  interceptions?: number;
  standingTackle?: number;
  slidingTackle?: number;
  defenseAwareness?: number;
  strength?: number;
  jumping?: number;
  stamina?: number;
  aggression?: number;
  composure?: number;
  penaltyTaking?: number;
  freekickAccuracy?: number;
  curve?: number;
  gkHandling?: number;
  gkDiving?: number;
  gkKicking?: number;
  gkPositioning?: number;
  gkReflexes?: number;
}

// Base player pool for generating realistic squads
const BASE_PLAYERS: Partial<PlayerData>[] = [
  {
    name: "Harry Maguire",
    firstName: "Harry",
    lastName: "Maguire",
    position: "CB",
    alternatePositions: ["RCB", "LCB"],
    nationality: "England",
    age: 31,
    birthDate: "1993-03-05",
    overall: 81,
    potential: 81,
    value: 45000000,
    wage: 190000,
    preferredFoot: "Right",
    height: 194,
    weight: 88,
    workRateAttacking: "Medium",
    workRateDefending: "High",
    weakFoot: 4,
    skillMoves: 1,
  },
  {
    name: "Alejandro Garnacho",
    firstName: "Alejandro",
    lastName: "Garnacho",
    position: "LW",
    alternatePositions: ["LM", "LF"],
    nationality: "Argentina",
    secondNationality: "Spain",
    age: 20,
    birthDate: "2004-07-01",
    overall: 79,
    potential: 90,
    value: 75000000,
    wage: 120000,
    preferredFoot: "Left",
    height: 180,
    weight: 76,
    workRateAttacking: "High",
    workRateDefending: "Medium",
    weakFoot: 3,
    skillMoves: 4,
  },
  {
    name: "Bruno Fernandes",
    firstName: "Bruno",
    lastName: "Fernandes",
    position: "CAM",
    alternatePositions: ["CM", "RW"],
    nationality: "Portugal",
    age: 29,
    birthDate: "1994-09-30",
    overall: 88,
    potential: 88,
    value: 120000000,
    wage: 290000,
    preferredFoot: "Right",
    height: 179,
    weight: 80,
    workRateAttacking: "High",
    workRateDefending: "High",
    weakFoot: 4,
    skillMoves: 5,
  },
  {
    name: "Lisandro Martinez",
    firstName: "Lisandro",
    lastName: "Martinez",
    position: "CB",
    alternatePositions: ["LB", "CDM"],
    nationality: "Argentina",
    age: 25,
    birthDate: "1998-01-18",
    overall: 82,
    potential: 86,
    value: 65000000,
    wage: 180000,
    preferredFoot: "Right",
    height: 175,
    weight: 78,
    workRateAttacking: "Medium",
    workRateDefending: "High",
    weakFoot: 3,
    skillMoves: 1,
  },
  {
    name: "David de Gea",
    firstName: "David",
    lastName: "de Gea",
    position: "GK",
    alternatePositions: [],
    nationality: "Spain",
    age: 33,
    birthDate: "1990-11-03",
    overall: 82,
    potential: 82,
    value: 15000000,
    wage: 320000,
    preferredFoot: "Right",
    height: 192,
    weight: 76,
    workRateAttacking: "Low",
    workRateDefending: "High",
    weakFoot: 1,
    skillMoves: 1,
  },
];

const PLAYER_POOL: Partial<PlayerData>[] = [
  ...BASE_PLAYERS,
  {
    name: "Jude Bellingham",
    firstName: "Jude",
    lastName: "Bellingham",
    position: "CM",
    alternatePositions: ["CAM", "CDM"],
    nationality: "England",
    age: 21,
    birthDate: "2003-06-17",
    overall: 84,
    potential: 92,
    value: 120000000,
    wage: 350000,
    preferredFoot: "Right",
    height: 186,
    weight: 84,
  },
  {
    name: "Vinicius Junior",
    firstName: "Vinicius",
    lastName: "Junior",
    position: "LW",
    alternatePositions: ["LM", "ST"],
    nationality: "Brazil",
    age: 24,
    birthDate: "2000-07-12",
    overall: 89,
    potential: 92,
    value: 150000000,
    wage: 400000,
    preferredFoot: "Left",
    height: 180,
    weight: 73,
  },
  {
    name: "Florian Wirtz",
    firstName: "Florian",
    lastName: "Wirtz",
    position: "LW",
    alternatePositions: ["CM", "CAM"],
    nationality: "Germany",
    age: 21,
    birthDate: "2003-05-03",
    overall: 86,
    potential: 94,
    value: 120000000,
    wage: 300000,
    preferredFoot: "Right",
    height: 180,
    weight: 70,
  },
];

/**
 * Generate realistic player attributes based on position
 */
function generateAttributes(position: string): PlayerAttributes {
  const baseAttrs: PlayerAttributes = {
    pace: 75,
    shooting: 75,
    passing: 75,
    dribbling: 75,
    defense: 75,
    physical: 75,
  };

  // Position-specific adjustments
  switch (position) {
    case "GK":
      return {
        ...baseAttrs,
        gkHandling: 85,
        gkDiving: 82,
        gkKicking: 78,
        gkPositioning: 80,
        gkReflexes: 84,
        defense: 85,
        physical: 78,
      };
    case "CB":
    case "RCB":
    case "LCB":
      return {
        ...baseAttrs,
        defense: 85,
        physical: 82,
        jumping: 80,
        headingAccuracy: 78,
        pace: 72,
      };
    case "LB":
    case "RB":
      return {
        ...baseAttrs,
        defense: 78,
        pace: 78,
        crossing: 75,
        agility: 78,
      };
    case "CDM":
      return {
        ...baseAttrs,
        defense: 80,
        passing: 78,
        physical: 80,
        pace: 75,
      };
    case "CM":
      return {
        ...baseAttrs,
        passing: 82,
        dribbling: 78,
        defense: 75,
        physical: 76,
      };
    case "CAM":
      return {
        ...baseAttrs,
        passing: 85,
        dribbling: 82,
        shooting: 80,
        vision: 87,
      };
    case "LW":
    case "RW":
      return {
        ...baseAttrs,
        pace: 88,
        dribbling: 85,
        shooting: 78,
        crossing: 80,
      };
    case "ST":
    case "CF":
      return {
        ...baseAttrs,
        shooting: 87,
        finishing: 85,
        pace: 82,
        strength: 80,
      };
    default:
      return baseAttrs;
  }
}

/**
 * Parse career mode save file
 */
export function parseSaveFile(
  fileBuffer: Buffer,
  fileName: string
): ParsedCareerData {
  const startTime = Date.now();

  // Simulate parsing metadata from file
  const fileSize = fileBuffer.length;
  const season = Math.floor(Math.random() * 3) + 1;

  // Select a random base player as the user's manager
  const managerName = `Manager ${Math.floor(Math.random() * 1000)}`;
  const clubName = "Manchester United";
  const league = "Premier League";

  // Generate squad by combining base players with random selections
  const squad: PlayerData[] = [];
  const usedNames = new Set<string>();

  // Add base players first
  BASE_PLAYERS.forEach((basePlayer, idx) => {
    const player: PlayerData = {
      id: `player_${idx}`,
      eaId: String(idx),
      name: basePlayer.name || "Unknown",
      firstName: basePlayer.firstName || "Unknown",
      lastName: basePlayer.lastName || "Unknown",
      age: basePlayer.age || 25,
      birthDate: basePlayer.birthDate || "1998-01-01",
      nationality: basePlayer.nationality || "England",
      secondNationality: basePlayer.secondNationality,
      club: clubName,
      league,
      position: basePlayer.position || "CM",
      alternatePositions: basePlayer.alternatePositions || [],
      shirt: idx + 1,
      overall: basePlayer.overall || 75,
      potential: basePlayer.potential || 80,
      value: basePlayer.value || 10000000,
      wage: basePlayer.wage || 100000,
      contractEnd: 2026 + season,
      contractStatus: "Active",
      releaseClause: (basePlayer.value || 10000000) * 1.5,
      preferredFoot: basePlayer.preferredFoot || "Right",
      weakFoot: basePlayer.weakFoot || 3,
      skillMoves: basePlayer.skillMoves || 3,
      workRateAttacking: basePlayer.workRateAttacking || "Medium",
      workRateDefending: basePlayer.workRateDefending || "Medium",
      height: basePlayer.height || 183,
      weight: basePlayer.weight || 79,
      attributes: generateAttributes(basePlayer.position || "CM"),
      traits: [],
      playstyles: [],
      playStylesPlus: [],
      loaned: false,
      isYouth: false,
      isCustom: false,
      development: {
        growthRate: Math.random() * 0.5,
        proneToInjury: Math.random() > 0.9,
        formBonus: Math.random() * 3 - 1.5,
      },
    };
    squad.push(player);
    usedNames.add(player.name);
  });

  // Add 15 more random players to simulate a full squad + bench
  for (let i = 0; i < 15; i++) {
    const randomPlayer = PLAYER_POOL[Math.floor(Math.random() * PLAYER_POOL.length)];
    if (!randomPlayer.name || usedNames.has(randomPlayer.name)) continue;

    const player: PlayerData = {
      id: `player_${BASE_PLAYERS.length + i}`,
      eaId: String(BASE_PLAYERS.length + i),
      name: randomPlayer.name || "Unknown",
      firstName: randomPlayer.firstName || "Unknown",
      lastName: randomPlayer.lastName || "Unknown",
      age: (randomPlayer.age || 25) + Math.floor(Math.random() * 5) - 2,
      birthDate: randomPlayer.birthDate || "1998-01-01",
      nationality: randomPlayer.nationality || "England",
      secondNationality: randomPlayer.secondNationality,
      club: clubName,
      league,
      position: randomPlayer.position || "CM",
      alternatePositions: randomPlayer.alternatePositions || [],
      shirt: BASE_PLAYERS.length + i + 1,
      overall: (randomPlayer.overall || 75) + Math.floor(Math.random() * 3) - 1,
      potential: (randomPlayer.potential || 80) + Math.floor(Math.random() * 5),
      value: (randomPlayer.value || 10000000) * (0.8 + Math.random() * 0.4),
      wage: (randomPlayer.wage || 100000) * (0.9 + Math.random() * 0.2),
      contractEnd: 2025 + season + Math.floor(Math.random() * 4),
      contractStatus: "Active",
      releaseClause: ((randomPlayer.value || 10000000) * 1.5) * (0.8 + Math.random() * 0.4),
      preferredFoot: randomPlayer.preferredFoot || (Math.random() > 0.5 ? "Right" : "Left"),
      weakFoot: Math.floor(Math.random() * 5) + 1,
      skillMoves: Math.floor(Math.random() * 6),
      workRateAttacking: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
      workRateDefending: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
      height: Math.floor(Math.random() * 30) + 170,
      weight: Math.floor(Math.random() * 20) + 70,
      attributes: generateAttributes(randomPlayer.position || "CM"),
      traits: [],
      playstyles: [],
      playStylesPlus: [],
      loaned: false,
      isYouth: Math.random() > 0.85,
      isCustom: false,
      development: {
        growthRate: Math.random() * 0.5,
        proneToInjury: Math.random() > 0.85,
        formBonus: Math.random() * 3 - 1.5,
      },
    };
    squad.push(player);
    usedNames.add(player.name);
  }

  const parseTime = Date.now() - startTime;

  return {
    career: {
      id: `career_${Date.now()}`,
      name: `${managerName}'s ${clubName} Career`,
      managerName,
      clubName,
      league,
      season,
      difficulty: ["Amateur", "Professional", "World Class", "Ultimate"][Math.floor(Math.random() * 4)],
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastModified: new Date().toISOString(),
      currency: "EUR",
    },
    managers: [
      {
        id: "mgr_1",
        name: managerName,
        nationality: "England",
        age: 45,
        joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    club: {
      id: "club_1",
      name: clubName,
      league,
      country: "England",
      stadium: "Old Trafford",
      founded: 1878,
      badge: "manchester-united",
      transferBudget: 150000000,
      wageBudget: 300000,
      objectivesRating: 0,
      objectives: ["Win the League", "Win FA Cup"],
      prestige: 95,
      reputation: 95,
    },
    squad,
    league: {
      id: "league_1",
      name: league,
      country: "England",
      teams: 20,
    },
    season,
    difficulty: "Professional",
    metadata: {
      fileSize,
      parseTime,
      playersExtracted: squad.length,
      version: "FC26",
    },
  };
}
