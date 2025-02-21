export interface LeaderboardEntry {
  id?: number;
  player_name: string;
  reaction_time: number;
  device_type: string;
  created_at?: string;
  linkedin_url?: string | null;
}
