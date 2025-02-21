"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useSound from "use-sound";
import { api } from "../lib/api";
import { LeaderboardEntry } from "../lib/types";
import { Toast } from "../components/Toast";
import { AllScoresModal } from "../components/AllScoresModal";

export default function Home() {
  const [gameState, setGameState] = useState<
    "idle" | "ready" | "countdown" | "waiting" | "finished"
  >("idle");
  const [lights, setLights] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [jumpStart, setJumpStart] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [playerName, setPlayerName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentLightRef = useRef(-1);
  const lastActionTimeRef = useRef<number>(0);
  const MIN_ACTION_DELAY = 300; // Minimum time between actions in milliseconds
  const [deviceType, setDeviceType] = useState(
    typeof window !== "undefined" && window.innerWidth <= 768 ? "mobile" : "web"
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const [showAllScores, setShowAllScores] = useState(false);

  // Load saved data on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("f1_player_name");
      const savedUrl = localStorage.getItem("f1_linkedin_url");
      if (savedName) setPlayerName(savedName);
      if (savedUrl) setLinkedinUrl(savedUrl);
    }
  }, []);

  // Monitor state changes for debugging
  useEffect(() => {
    //  console.log("Game State Changed:", gameState);
  }, [gameState]);

  useEffect(() => {
    //  console.log("Lights Changed:", lights);
  }, [lights]);

  useEffect(() => {
    //  console.log("Start Time:", startTime);
  }, [startTime]);

  // Ekran boyutu değişikliğini takip et
  useEffect(() => {
    const handleResize = () => {
      setDeviceType(window.innerWidth <= 768 ? "mobile" : "web");
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const canPerformAction = useCallback(() => {
    const now = performance.now();
    if (now - lastActionTimeRef.current < MIN_ACTION_DELAY) {
      return false;
    }
    lastActionTimeRef.current = now;
    return true;
  }, []);

  const startGame = useCallback(() => {
    //  console.log("🎮 Starting Game...");

    // Cleanup operations
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setGameState("ready");
    setJumpStart(false);
    setReactionTime(null);
    setLights([false, false, false, false, false]);
    setStartTime(null);
    currentLightRef.current = -1;

    // Add a short delay to ensure state updates are processed
    setTimeout(() => {
      intervalRef.current = setInterval(() => {
        currentLightRef.current++;
        //  console.log("🚥 Light Sequence:", currentLightRef.current);

        if (currentLightRef.current < 5) {
          setLights((prev) => {
            const newLights = [...prev];
            newLights[currentLightRef.current] = true;
            //  console.log("💡 Setting light", currentLightRef.current, "to ON");
            return newLights;
          });
        } else {
          //  console.log("🔄 All lights on, preparing for random delay...");
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          const randomDelay = 1000 + Math.random() * 3000;
          //  console.log("⏳ Setting random delay:", randomDelay.toFixed(2), "ms");

          timeoutRef.current = setTimeout(() => {
            //  console.log("🎯 Lights out! Starting reaction test...");
            setLights([false, false, false, false, false]);
            setStartTime(performance.now());
            setGameState("waiting");
            timeoutRef.current = null;
          }, randomDelay);
        }
      }, 1000);
    }, 100);
  }, []);

  const saveScore = async () => {
    if (jumpStart) {
      setShowModal(false);
      setGameState("idle");
      return;
    }

    const trimmedName = playerName.trim();
    const trimmedUrl = linkedinUrl.trim();
    if (!reactionTime || !trimmedName || !startTime) return;

    // Validate LinkedIn URL if provided
    if (trimmedUrl && !trimmedUrl.startsWith("https://www.linkedin.com/in/")) {
      setToast({
        message:
          "Invalid LinkedIn URL format. It should start with https://www.linkedin.com/in/",
        type: "error",
      });
      return;
    }

    try {
      await api.addScore({
        player_name: trimmedName,
        reaction_time: reactionTime,
        device_type: deviceType,
        start_time: startTime,
        end_time: startTime + reactionTime,
        linkedin_url: trimmedUrl || null,
      });

      localStorage.setItem("f1_player_name", trimmedName);
      if (trimmedUrl) {
        localStorage.setItem("f1_linkedin_url", trimmedUrl);
      }

      setShowModal(false);
      setGameState("idle");
      setToast({
        message: "Score saved successfully! 🎉",
        type: "success",
      });
    } catch (error: any) {
      console.error("Error saving score:", error);
      setToast({
        message: error.message || "Failed to save score. Please try again.",
        type: "error",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveScore();
    }
  };

  const handleClick = useCallback(() => {
    // Modal veya leaderboard açıkken tıklamaları engelle
    if (showModal || showLeaderboard) return;

    if (!canPerformAction()) return;
    //  console.log("👆 Click detected in state:", gameState);

    if (gameState === "idle") {
      startGame();
    } else if (gameState === "ready" || gameState === "waiting") {
      if (startTime === null || gameState === "ready") {
        //  console.log("⚠️ Jump start detected!");
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setJumpStart(true);
        setGameState("finished");
        setLights([false, false, false, false, false]);
        setShowModal(true);
      } else {
        const currentTime = performance.now();
        const reaction = currentTime - startTime;
        //  console.log("✨ Reaction time:", reaction.toFixed(3), "ms");
        setReactionTime(reaction);
        setGameState("finished");
        setShowModal(true);
      }
    }
  }, [
    gameState,
    startTime,
    startGame,
    canPerformAction,
    showModal,
    showLeaderboard,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Modal veya leaderboard açıkken space tuşunu engelle
      if (showModal || showLeaderboard) return;

      if (event.code === "Space" && !event.repeat) {
        handleClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [handleClick, showModal, showLeaderboard]);

  const getReactionMessage = () => {
    if (!reactionTime) return "";

    if (reactionTime < 150)
      return "🏎️ Are you secretly Lewis Hamilton? That was insane! 🤯";
    if (reactionTime < 200) return "🚀 F1 teams want to know your location! 🔥";
    if (reactionTime < 250)
      return "⚡ Quick enough to catch a falling phone! 📱";
    if (reactionTime < 300)
      return "🎯 Not bad, but my grandma is faster... jk! 👵";
    if (reactionTime < 350) return "🐢 Getting there... maybe try coffee? ☕";
    if (reactionTime < 400) return "🦥 Are you playing in slow motion? 🎬";
    if (reactionTime < 500) return "🐌 Did you fall asleep mid-game? 😴";
    if (reactionTime < 600) return "🧟‍♂️ Internet Explorer, is that you? 🤔";
    if (reactionTime < 800)
      return "🦕 Even dinosaurs were faster than this! 😅";
    return "🐨 Plot twist: Sloths are asking for racing tips! 🌿";
  };

  const getJumpStartMessage = () => {
    const messages = [
      "🚫 Too eager! This isn't a drag race! 🏎️",
      "⚠️ Whoa there, Speed Racer! False start! 🏁",
      "😅 Someone's had too much energy drink! ⚡",
      "🤦‍♂️ The lights weren't even out yet! 🚦",
      "😂 Patience young grasshopper... 🦗",
      "🎮 This isn't your typical button masher! 🕹️",
      "🚨 5-second penalty for being too excited! 📝",
      "🏃‍♂️ Running before learning to walk, eh? 🚶‍♂️",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Load leaderboard data
  const loadLeaderboard = async () => {
    try {
      const data = await api.getTopScores(10);
      setLeaderboardData(data);
    } catch (error: any) {
      console.error("Error loading leaderboard:", error);
      setToast({
        message:
          error.message || "Failed to load leaderboard. Please try again.",
        type: "error",
      });
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4 relative"
      onClick={handleClick}
    >
      {/* Leaderboard Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          loadLeaderboard();
          setShowLeaderboard(true);
        }}
        className="absolute top-4 left-4 p-2 rounded-full bg-yellow-600 hover:bg-yellow-700 transition-colors"
      >
        🏆
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          // loadLeaderboard();
          setShowAllScores(true);
        }}
        className="absolute top-16 left-4 p-2 rounded-full bg-purple-600 hover:bg-purple-700 transition-colors"
      >
        📊
      </button>

      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 sm:mb-8">
          F1 Reflex Test 🏎️
        </h1>

        {gameState === "idle" && (
          <div className="space-y-3 sm:space-y-4 text-center mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl">How to Play?</h2>
            <ul
              className="space-y-1.5 sm:space-y-2 text-base sm:text-lg"
              aria-label="Game rules"
            >
              <li>1. Click the screen or press spacebar 🖱️</li>
              <li>2. Five red lights will turn on sequentially 🚥</li>
              <li>3. Click immediately when lights go out! ⚡</li>
              <li>4. Early click will result in a penalty 🚫</li>
            </ul>
            <p
              className="text-lg sm:text-xl mt-3 sm:mt-4"
              role="status"
              aria-live="polite"
            >
              Click anywhere to start 🎮
            </p>
          </div>
        )}

        <div
          className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8"
          role="alert"
          aria-label="F1 lights"
        >
          {/* Top row of lights */}
          <div className="flex justify-center space-x-3 sm:space-x-4">
            {lights.map((isOn, index) => (
              <div
                key={`top-${index}`}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${
                  isOn ? "bg-red-600" : "bg-red-900"
                } transition-colors duration-200 shadow-lg`}
                role="img"
                aria-label={isOn ? "Light on" : "Light off"}
              />
            ))}
          </div>

          {/* Bottom row of lights */}
          <div className="flex justify-center space-x-3 sm:space-x-4">
            {lights.map((isOn, index) => (
              <div
                key={`bottom-${index}`}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${
                  isOn ? "bg-red-600" : "bg-red-900"
                } transition-colors duration-200 shadow-lg`}
                role="img"
                aria-label={isOn ? "Light on" : "Light off"}
              />
            ))}
          </div>
        </div>

        {gameState === "finished" && !showModal && (
          <div
            className="text-center space-y-3 sm:space-y-4"
            role="status"
            aria-live="polite"
          >
            {!jumpStart && (
              <>
                <h2 className="text-2xl sm:text-3xl font-bold">
                  {reactionTime?.toFixed(3)} ms ⚡
                </h2>
                <p className="text-lg sm:text-xl">{getReactionMessage()}</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Score Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="score-modal-title"
        >
          <div
            className="bg-gray-800 p-4 sm:p-6 rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {jumpStart ? (
              <>
                <h2
                  id="score-modal-title"
                  className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-red-500"
                >
                  {getJumpStartMessage()}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setGameState("idle");
                  }}
                  className="w-full py-2.5 sm:py-3 rounded font-bold bg-gray-600 hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <h2
                  id="score-modal-title"
                  className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-center"
                >
                  {reactionTime?.toFixed(3)} ms ⚡
                </h2>
                <p className="text-lg sm:text-xl mb-4 sm:mb-6 text-center">
                  {getReactionMessage()}
                </p>

                <div className="space-y-3 sm:space-y-4">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) =>
                      setPlayerName(e.target.value.trim().slice(0, 20))
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your name (max 20 chars)"
                    className="w-full p-2 rounded bg-gray-700 text-white text-[16px] sm:text-lg"
                    autoFocus
                    required
                    minLength={1}
                    maxLength={20}
                    aria-label="Name (max 20 characters)"
                  />

                  {/* <input
                    type="text"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="LinkedIn URL (optional) - https://www.linkedin.com/in/..."
                    className="w-full p-2 rounded bg-gray-700 text-white text-[16px] sm:text-lg"
                  /> */}

                  <button
                    onClick={saveScore}
                    disabled={!playerName.trim()}
                    className={`w-full py-2.5 sm:py-3 rounded font-bold transition-colors ${
                      playerName.trim()
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-600 cursor-not-allowed"
                    }`}
                    aria-label="Save Score"
                  >
                    Save Score
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leaderboard-modal-title"
        >
          <div
            className="bg-gray-800 p-4 sm:p-6 rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2
                id="leaderboard-modal-title"
                className="text-xl sm:text-2xl font-bold"
              >
                Top 10 Reactions 🏆
              </h2>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div
              className="space-y-2 sm:space-y-4"
              role="list"
              aria-label="Leaderboard"
            >
              {leaderboardData.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2 sm:p-3 bg-gray-700 rounded"
                  role="listitem"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-lg sm:text-xl font-bold">
                      {index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : index === 2
                        ? "🥉"
                        : `${index + 1}.`}
                    </span>
                    <span className="font-semibold text-base sm:text-lg">
                      {entry.player_name}
                    </span>
                  </div>
                  <span className="text-yellow-400 font-mono text-base sm:text-lg">
                    {Math.floor(entry.reaction_time)}.
                    {Math.floor((entry.reaction_time % 1) * 10)} MS
                  </span>
                </div>
              ))}

              {leaderboardData.length === 0 && (
                <p className="text-center text-gray-400 text-base sm:text-lg">
                  No records yet. Be the first! 🚀
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* <div className="flex flex-col items-center gap-4 mt-4">
        <button
          onClick={() => setShowLeaderboard(true)}
          className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
        >
          <span>🏆</span>
        </button>

        <button
          onClick={() => setShowAllScores(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
        >
          <span>📊</span>
        </button>
      </div> */}

      <AllScoresModal
        isOpen={showAllScores}
        onClose={() => setShowAllScores(false)}
      />
    </main>
  );
}
