import { useEffect, useRef, useState } from "react";

const COLORS = [
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  duration: number;
  delay: number;
  rotation: number;
}

interface ConfettiCelebrationProps {
  trigger: boolean;
}

export function ConfettiCelebration({ trigger }: ConfettiCelebrationProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const shownRef = useRef(false);

  useEffect(() => {
    if (!trigger) return;

    // Only show once per day
    const today = new Date().toISOString().slice(0, 10);
    const key = `confetti-shown-${today}`;
    if (localStorage.getItem(key) || shownRef.current) return;

    shownRef.current = true;
    localStorage.setItem(key, "1");

    // Spawn 40 confetti pieces
    const newPieces: ConfettiPiece[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      duration: 2000 + Math.random() * 2000,
      delay: Math.random() * 800,
      rotation: Math.random() * 360,
    }));

    setPieces(newPieces);

    // Clean up after animations finish
    const timer = setTimeout(() => {
      setPieces([]);
      shownRef.current = false;
    }, 4500);

    return () => clearTimeout(timer);
  }, [trigger]);

  if (pieces.length === 0) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDuration: `${piece.duration}ms`,
            animationDelay: `${piece.delay}ms`,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
