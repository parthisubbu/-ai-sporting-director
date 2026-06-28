// ── Career ───────────────────────────────────────────────────
export interface Career {
  id: string;
  user_id: string;
  career_name: string;
  club_name: string | null;
  league: string | null;
  season: string | null;
  difficulty: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

// ── Club ─────────────────────────────────────────────────────
export interface Club {
  id: string;
  career_id: string;
  name: string;
  league: string | null;
  transfer_budget: number;
  wage_budget: number;
  objectives: string[];
  prestige: number;
}

// ── Player ───────────────────────────────────────────────────
export interface Player {
  id: string;
  career_id: string;
  ea_id: string | null;
  name: string;
  age: number | null;
  birth_date: string | null;
  nationality: string | null;
  nationality2: string | null;
  club_name: string | null;
  league: string | null;
  position: string | null;
  alt_positions: string[];
  overall: number | null;
  potential: number | null;
  value: number | null;
  wage: number | null;
  contract_end: string | null;
  release_clause: number | null;
  weak_foot: number | null;
  skill_moves: number | null;
  work_rate_att: string | null;
  work_rate_def: string | null;
  foot: string | null;
  height: number | null;
  weight: number | null;
  attributes: PlayerAttributes;
  playstyles: string[];
  playstyles_plus: string[];
  traits: string[];
  development: PlayerDevelopment;
  injury: PlayerInjury;
  is_user_squad: boolean;
  is_youth: boolean;
}

export interface PlayerAttributes {
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
  // detailed
  acceleration?: number;
  sprint_speed?: number;
  positioning?: number;
  finishing?: number;
  shot_power?: number;
  long_shots?: number;
  volleys?: number;
  penalties?: number;
  vision?: number;
  crossing?: number;
  fk_accuracy?: number;
  short_passing?: number;
  long_passing?: number;
  curve?: number;
  agility?: number;
  balance?: number;
  reactions?: number;
  ball_control?: number;
  dribbling_attr?: number;
  composure?: number;
  interceptions?: number;
  heading_accuracy?: number;
  def_awareness?: number;
  standing_tackle?: number;
  sliding_tackle?: number;
  jumping?: number;
  stamina?: number;
  strength?: number;
  aggression?: number;
  gk_diving?: number;
  gk_handling?: number;
  gk_kicking?: number;
  gk_positioning?: number;
  gk_reflexes?: number;
}

export interface PlayerDevelopment {
  archetype?: string;
  xp?: number;
  level?: number;
  milestones?: string[];
}

export interface PlayerInjury {
  is_injured?: boolean;
  type?: string;
  return_date?: string;
}

// ── Report ───────────────────────────────────────────────────
export type ReportType = 'squad' | 'transfer' | 'tactical' | 'development' | 'scouting' | 'full';

export interface Report {
  id: string;
  career_id: string;
  type: ReportType;
  title: string | null;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Conversation ─────────────────────────────────────────────
export interface Conversation {
  id: string;
  career_id: string;
  user_message: string;
  ai_response: string;
  created_at: string;
}

// ── Upload ───────────────────────────────────────────────────
export type UploadStatus = 'uploaded' | 'processing' | 'complete' | 'failed';

export interface CareerUpload {
  id: string;
  career_id: string;
  filename: string;
  storage_path: string;
  file_size: number | null;
  status: UploadStatus;
  error_msg: string | null;
  uploaded_at: string;
}

// ── Analysis ─────────────────────────────────────────────────
export interface SquadAnalysis {
  overall_score: number;
  attack_score: number;
  midfield_score: number;
  defense_score: number;
  depth_score: number;
  potential_score: number;
  strengths: string[];
  weaknesses: string[];
  priorities: string[];
}

export interface TransferTarget {
  name: string;
  position: string;
  age: number;
  club: string;
  overall: number;
  potential: number;
  value: number;
  reason: string;
  tactical_fit: string;
  risk: 'low' | 'medium' | 'high';
}
