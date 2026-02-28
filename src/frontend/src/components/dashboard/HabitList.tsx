import { cn } from "@/lib/utils";
import {
  Bell,
  Check,
  MessageCircle,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import type { Habit, StreakData } from "../../backend.d";

interface HabitRowProps {
  habit: Habit;
  isCompleted: boolean;
  streak: StreakData;
  onToggle: () => void;
  onDelete?: (habitId: bigint) => void;
  delay: number;
  whatsappNumber?: string;
  reminderTime?: string;
  onSetReminder?: (habitId: bigint, time: string) => void;
}

function HabitRow({
  habit,
  isCompleted,
  streak,
  onToggle,
  onDelete,
  delay,
  whatsappNumber,
  reminderTime,
  onSetReminder,
}: HabitRowProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [wasJustCompleted, setWasJustCompleted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [localTime, setLocalTime] = useState(reminderTime ?? "");
  const timeInputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    if (!isCompleted) {
      setIsFlashing(true);
      setWasJustCompleted(true);
      setTimeout(() => setIsFlashing(false), 700);
      setTimeout(() => setWasJustCompleted(false), 2000);
    }
    onToggle();
  };

  const handleSendReminder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = encodeURIComponent(
      `Reminder: Complete your habit "${habit.name}" today!`,
    );
    const url = whatsappNumber
      ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleBellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTimePicker((v) => !v);
    if (!showTimePicker) {
      // Focus the time input once it appears
      setTimeout(() => timeInputRef.current?.focus(), 50);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTime(e.target.value);
  };

  const handleTimeBlur = () => {
    if (onSetReminder) {
      onSetReminder(habit.id, localTime);
    }
    setShowTimePicker(false);
  };

  const handleClearReminder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalTime("");
    if (onSetReminder) {
      onSetReminder(habit.id, "");
    }
    setShowTimePicker(false);
  };

  const hasReminder = !!reminderTime;

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

      {/* Name + reminder badge */}
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
        {hasReminder && !wasJustCompleted && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400/80 font-medium mt-0.5">
            ⏰ {reminderTime}
          </span>
        )}

        {/* Inline time picker */}
        <AnimatePresence>
          {showTimePicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="mt-1.5 flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                ref={timeInputRef}
                type="time"
                value={localTime}
                onChange={handleTimeChange}
                onBlur={handleTimeBlur}
                className="bg-muted/40 border border-border/50 rounded-lg text-xs text-foreground px-2 py-1 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 cursor-pointer"
                style={{ colorScheme: "dark" }}
                aria-label={`Set reminder time for ${habit.name}`}
              />
              {localTime && (
                <button
                  type="button"
                  onClick={handleClearReminder}
                  className="w-5 h-5 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Clear reminder"
                >
                  <X size={11} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Streaks + actions */}
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

        {/* Send Reminder (WhatsApp) — always visible */}
        <button
          type="button"
          onClick={handleSendReminder}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-green-400 hover:text-green-300 hover:bg-green-400/10 transition-colors duration-150 shrink-0"
          aria-label={`Send WhatsApp reminder for ${habit.name}`}
          title="Send WhatsApp reminder"
        >
          <MessageCircle size={14} />
        </button>

        {/* Bell / reminder scheduler */}
        {onSetReminder && (
          <button
            type="button"
            onClick={handleBellClick}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg transition-colors duration-150 shrink-0",
              hasReminder
                ? "text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
            aria-label={
              hasReminder
                ? `Edit reminder for ${habit.name} (currently ${reminderTime})`
                : `Set reminder for ${habit.name}`
            }
            title={
              hasReminder ? `Reminder at ${reminderTime}` : "Set daily reminder"
            }
          >
            <Bell size={14} />
          </button>
        )}

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
  whatsappNumber?: string;
  onSetReminder?: (habitId: bigint, time: string) => void;
}

export function HabitList({
  habits,
  streaks,
  completedToday,
  onToggle,
  onDelete,
  whatsappNumber,
  onSetReminder,
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
            whatsappNumber={whatsappNumber}
            reminderTime={habit.reminderTime || undefined}
            onSetReminder={onSetReminder}
          />
        ))}
      </div>
    </div>
  );
}
