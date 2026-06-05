export interface Team {
  id: string;
  name: string;
  player_ids: string[];
  created_at: string;
}

export interface Config {
  id: number;
  tourney_name: string;
  budget_cap: number;
  points_scheme: Record<string, number>;
  submission_deadline: string | null;
  leaderboard_visible: boolean;
}
