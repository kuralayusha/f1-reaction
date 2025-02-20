import { createClient } from "@supabase/supabase-js";

// These will be provided by Supabase when you create a new project
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export type LeaderboardEntry = {
  id: number;
  created_at: string;
  player_name: string | null;
  reaction_time: number;
  device_type: string | null;
};

// Database helper functions
export const leaderboardActions = {
  // Get top 10 reaction times
  getTopScores: async (limit = 10) => {
    const { data, error } = await supabase
      .from("leaderboard_f1")
      .select("*")
      .order("reaction_time", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data as LeaderboardEntry[];
  },

  // Add new score to leaderboard
  addScore: async (entry: Omit<LeaderboardEntry, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("leaderboard_f1")
      .insert([entry])
      .select();

    if (error) throw error;
    return data[0] as LeaderboardEntry;
  },

  // Get player's best score
  getPlayerBestScore: async (playerName: string) => {
    const { data, error } = await supabase
      .from("leaderboard_f1")
      .select("*")
      .eq("player_name", playerName)
      .order("reaction_time", { ascending: true })
      .limit(1);

    if (error) throw error;
    return data[0] as LeaderboardEntry | null;
  },
};
