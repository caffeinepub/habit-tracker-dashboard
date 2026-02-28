import { cn } from "@/lib/utils";
import { Check, Sparkles, Trash2, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Habit, StreakData } from "../../backend.d";

interface HabitRowProps {
  habit: Habit;
  isCompleted: boolean;
  streak: StreakData;
  onToggle: () => void;
  onDelete?: (habitId: bigint) => void;
  delay: number;
}

function HabitRow({
  habit,
  isCompleted,
  streak,
  onToggle,
  onDelete,
  delay,
}: HabitRowProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [wasJustCompleted, setWasJustCompleted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = () => {
    if (!isCompleted) {
      setIsFlashing(true);
      setWasJustCompleted(true);
      setTimeout(() => setIsFlashing(false), 700);
      setTimeout(() => setWasJustCompleted(false), 2000);
    }
    onToggle();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.08, ease: "easeOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
        isCompleted
          ? "habit-complete border-success/40"
          : "border-border/50 hover:border-border bg-card/30",
      )}
    >
      {/* Flash overlay */}
      {isFlashing && (
        <div className="absolute inset-0 rounded-xl animate-habit-flash pointer-events-none" />
      )}

      {/* Checkbox */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "relative w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 shrink-0",
          isCompleted
            ? "bg-success border-success shadow-glow-green"
            : "border-border/60 hover:border-primary hover:bg-primary/10",
        )}
        aria-label={
          isCompleted ? `Unmark ${habit.name}` : `Mark ${habit.name} as done`
        }
      >
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 400 }}
            >
              <Check size={13} className="text-white stroke-[3]" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Emoji + Color Badge */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{
          backgroundColor: `${habit.color}33`,
          border: `1px solid ${habit.color}44`,
        }}
      >
        {habit.emoji}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-semibold transition-colors",
            isCompleted ? "text-success/90" : "text-foreground",
          )}
        >
          {habit.name}
        </p>
        {isCompleted && wasJustCompleted && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-success/70 flex items-center gap-1"
          >
            <Sparkles size={10} />
            Nice work!
          </motion.p>
        )}
      </div>

      {/* Streaks */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🔥</span>
          <div className="text-right">
            <p className="text-sm font-bold text-foreground leading-none">
              {streak.currentStreak.toString()}
            </p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
              streak
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
          style={{
            backgroundColor: `${habit.color}22`,
            color: habit.color,
            border: `1px solid ${habit.color}33`,
          }}
        >
          <Trophy size={10} />
          <span>{streak.bestStreak.toString()}d</span>
        </div>

        {/* Delete button — visible on row hover */}
        {onDelete && (
          <AnimatePresence>
            {isHovered && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(habit.id);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150"
                aria-label={`Delete ${habit.name}`}
              >
                <Trash2 size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

interface HabitListProps {
  habits: Habit[];
  streaks: Array<[Habit, StreakData]>;
  completedToday: Set<string>;
  onToggle: (habitId: bigint) => void;
  onDelete?: (habitId: bigint) => void;
}

export function HabitList({
  habits,
  streaks,
  completedToday,
  onToggle,
  onDelete,
}: HabitListProps) {
  const streakMap = new Map(streaks.map(([h, s]) => [h.id.toString(), s]));
  const completionCount = habits.filter((h) =>
    completedToday.has(h.id.toString()),
  ).length;
  const completionPct =
    habits.length > 0 ? Math.round((completionCount / habits.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {completionCount} of {habits.length} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-success to-chart-2"
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <span className="text-sm font-semibold text-foreground">
            {completionPct}%
          </span>
        </div>
      </div>

      {/* Habit rows */}
      <div className="space-y-2">
        {habits.map((habit, i) => (
          <HabitRow
            key={habit.id.toString()}
            habit={habit}
            isCompleted={completedToday.has(habit.id.toString())}
            streak={
              streakMap.get(habit.id.toString()) ?? {
                currentStreak: 0n,
                bestStreak: 0n,
              }
            }
            onToggle={() => onToggle(habit.id)}
            onDelete={onDelete}
            delay={i}
          />
        ))}
      </div>
    </div>
  );
}
