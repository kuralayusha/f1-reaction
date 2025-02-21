import { useState, useEffect } from "react";
import { LeaderboardEntry } from "../lib/types";
import { api } from "../lib/api";
import { formatReactionTime } from "../lib/utils/format";

interface AllScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AllScoresModal = ({ isOpen, onClose }: AllScoresModalProps) => {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadScores();
    }
  }, [isOpen]);

  const loadScores = async () => {
    try {
      setLoading(true);
      const data = await api.getAllScores();
      setScores(data);
    } catch (error) {
      console.error("Error loading scores:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-6 text-white">All Scores</h2>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="text-left text-gray-400">
                  <th className="py-2 px-4">Player</th>
                  <th className="py-2 px-4">Reaction</th>
                  <th className="py-2 px-4">Device</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score, index) => (
                  <tr
                    key={index}
                    className="border-t border-gray-800 text-gray-300 hover:bg-gray-800"
                  >
                    <td className="py-3 px-4">{score.player_name}</td>
                    <td className="py-3 px-4">
                      {formatReactionTime(score.reaction_time)}
                    </td>
                    <td className="py-3 px-4">
                      {score.device_type === "mobile" ? "📱" : "💻"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
