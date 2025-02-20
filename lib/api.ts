import { LeaderboardEntry } from "./types";
import { generateSignature } from "./utils/signature";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Ortak headers'ları oluşturan yardımcı fonksiyon

const createHeaders = (data: any = {}) => ({
  "Content-Type": "application/json",
  "X-Client-Signature": generateSignature(data),
});

export const api = {
  getTopScores: async (limit = 10): Promise<LeaderboardEntry[]> => {
    const queryParams = { limit };
    const response = await fetch(`${API_BASE_URL}/api/leaderboard`, {
      headers: createHeaders(queryParams),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch leaderboard");
    }
    return response.json();
  },

  addScore: async (entry: {
    player_name: string;
    reaction_time: number;
    device_type: string;
    start_time: number;
    end_time: number;
  }): Promise<LeaderboardEntry> => {
    const response = await fetch(`${API_BASE_URL}/api/scores`, {
      method: "POST",
      headers: createHeaders(entry),
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save score");
    }
    return response.json();
  },

  getPlayerBestScore: async (
    playerName: string
  ): Promise<LeaderboardEntry | null> => {
    const queryParams = { playerName };
    const response = await fetch(
      `${API_BASE_URL}/api/scores/${encodeURIComponent(playerName)}`,
      {
        headers: createHeaders(queryParams),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch player score");
    }
    return response.json();
  },
};
