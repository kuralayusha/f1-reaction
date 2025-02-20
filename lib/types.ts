export type LeaderboardEntry = {
  id: number;
  created_at: string;
  player_name: string | null;
  reaction_time: number;
  device_type: string | null;
};
