"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";

export default function AimGame() {
  const { address } = useAccount();
  const [hits, setHits] = useState(0);
  const [circle, setCircle] = useState<{ x: number; y: number; size: number } | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const { data: playerStats } = useScaffoldReadContract({
    contractName: "Aimnad",
    functionName: "getCurrentMatchHits",
    args: [address],
  });

  const spawnCircle = useCallback(() => {
    const size = Math.floor(Math.random() * 50) + 30;
    const x = Math.floor(Math.random() * (window.innerWidth - size));
    const y = Math.floor(Math.random() * (window.innerHeight - size));
    setCircle({ x, y, size });

    const id = setTimeout(() => setCircle(null), 1000);
    setTimeoutId(id);
  }, []);

  const handleCircleClick = async () => {
    if (!address) return;
    setHits(prev => prev + 1);

    try {
      await fetch("/api/relayer/register-hit", {
        method: "POST",
        body: JSON.stringify({ wallet: address }),
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error registering hit:", error);
    }

    if (timeoutId) clearTimeout(timeoutId);
    setCircle(null);
    spawnCircle();
  };

  const startGame = () => {
    setHits(0);
    setGameActive(true);
    spawnCircle();
  };

  const endGame = async () => {
    if (!address) return;
    setGameActive(false);
    setCircle(null);

    try {
      await fetch("/api/relayer/finalize-match", {
        method: "POST",
        body: JSON.stringify({ wallet: address }),
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error finalizing match:", error);
    }
  };

  useEffect(() => {
    if (!gameActive && timeoutId) {
      clearTimeout(timeoutId);
    }
  }, [gameActive, timeoutId]);

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 w-full h-full bg-base-100 overflow-hidden">
      {!gameActive && (
        <button onClick={startGame} className="mb-4">
          Start Game
        </button>
      )}
      {gameActive && (
        <button onClick={endGame} className="mb-4">
          End Game
        </button>
      )}

      <div className="text-xl">Hits this game: {hits}</div>

      {circle && (
        <div
          onClick={handleCircleClick}
          className="absolute bg-red-500 rounded-full cursor-pointer transition-all"
          style={{
            left: circle.x,
            top: circle.y,
            width: circle.size,
            height: circle.size,
          }}
        />
      )}
    </div>
  );
}
