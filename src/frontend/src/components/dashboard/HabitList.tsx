import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Bell,
  Check,
  CheckCheck,
  ClipboardList,
  GripVertical,
  Pencil,
  Plus,
  Snowflake,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type RefObject, useRef, useState } from "react";
import { toast } from "sonner";
import type { Habit, StreakData, WeeklyChallenge } from "../../backend.d";
import {
  useSaveHabitNote,
  useSetHabitReminderTime,
} from "../../hooks/useQueries";
import { useTheme } from "../../hooks/useTheme";
import { CATEGORY_COLORS, DIFFICULTY_COLORS } from "./AddHabitModal";
import { ChallengeBanner } from "./ChallengeBanner";
import { NoteDialog } from "./NoteDialog";

const today = new Date().toISOString().split("T")[0];

const ALL_CATEGORIES = [
  "All",
  "Health",
  "Work",
  "Personal",
  "Finance",
  "Learning",
  "Other",
] as const;
type CategoryFilter = (typeof ALL_CATEGORIES)[number];

const QUICK_EMOJIS = [
  "⭐",
  "💧",
  "🏃",
  "📚",
  "🧘",
  "😴",
  "🎯",
  "💪",
  "🥗",
  "🎨",
  "🎵",
  "🌱",
  "🔥",
  "💎",
  "🎮",
  "🧠",
];

const STREAK_MILESTONES = [7, 14, 30, 60, 100];

// ─── Reminder Dialog ──────────────────────────────────────────────────────────

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habitName: string;
  currentTime: string;
  currentCustomMsg: string;
  onSet: (time: string, customMsg: string) => void;
  onClear: () => void;
}

function ReminderDialog({
  open,
  onOpenChange,
  habitName,
  currentTime,
  currentCustomMsg,
  onSet,
  onClear,
}: ReminderDialogProps) {
  const [localTime, setLocalTime] = useState(currentTime);
  const [localMsg, setLocalMsg] = useState(currentCustomMsg);
  const { resolvedTheme } = useTheme();

  const handleSet = () => {
    if (localTime) {
      onSet(localTime, localMsg.trim());
      onOpenChange(false);
    }
  };

  const handleClear = () => {
    setLocalTime("");
    setLocalMsg("");
    onClear();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground text-base font-bold">
            <Bell size={16} className="text-amber-500" />
            Set Daily Reminder
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <p className="text-sm text-muted-foreground">
            Choose a time to get a daily reminder for{" "}
            <strong className="text-foreground">{habitName}</strong>.
          </p>
          <div className="space-y-2">
            <label
              htmlFor="reminder-time-input"
              className="text-sm font-medium text-foreground"
            >
              Reminder time
            </label>
            <input
              id="reminder-time-input"
              type="time"
              value={localTime}
              onChange={(e) => setLocalTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-background/60 text-foreground text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer"
              style={{
                colorScheme: resolvedTheme === "dark" ? "dark" : "light",
              }}
              aria-label={`Set reminder time for ${habitName}`}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="reminder-msg-input"
              className="text-sm font-medium text-foreground"
            >
              Custom message{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <input
              id="reminder-msg-input"
              type="text"
              placeholder={`Time to complete ${habitName}!`}
              value={localMsg}
              onChange={(e) => setLocalMsg(e.target.value.slice(0, 80))}
              className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-background/60 text-foreground text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors"
              aria-label="Custom reminder message"
            />
          </div>
          {localTime && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25">
              <span className="text-amber-500 text-sm">⏰</span>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Reminder will fire daily at {localTime}
                {localMsg && ` · "${localMsg}"`}
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          {currentTime && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleClear}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-sm"
            >
              <X size={13} className="mr-1.5" />
              Clear
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border/60"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSet}
            disabled={!localTime}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Bell size={13} className="mr-1.5" />
            Set Reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Goal Progress Bar ─────────────────────────────────────────────────────────

function GoalProgressBar({
  habit,
  completionCount,
}: {
  habit: Habit;
  completionCount: number;
}) {
  const target = Number(habit.goalTargetCount);
  if (!habit.goalDescription || target <= 0) return null;
  const pct = Math.min(100, Math.round((completionCount / target) * 100));

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="mt-1.5 w-full">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-muted-foreground truncate max-w-[120px]">
                🎯 {habit.goalDescription}
              </span>
              <span className="text-[9px] font-semibold text-muted-foreground ml-1 shrink-0">
                {completionCount}/{target}
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted/40 overflow-hidden w-full">
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor:
                    pct >= 100 ? "#22c55e" : "oklch(var(--primary))",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Goal: {habit.goalDescription}
            {habit.goalDeadline && ` · Deadline: ${habit.goalDeadline}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Habit Row ────────────────────────────────────────────────────────────────

interface HabitRowProps {
  habit: Habit;
  isCompleted: boolean;
  streak: StreakData;
  previousStreak: number;
  onToggle: () => void;
  onDelete?: (habitId: bigint) => void;
  onEdit?: (habitId: bigint) => void;
  delay: number;
  onSetReminder?: (habitId: bigint, time: string, customMsg: string) => void;
  onStreakFreeze?: (habitId: bigint) => void;
  hasStreakRisk?: boolean;
  dragHandleRef?: RefObject<HTMLDivElement | null>;
  dragging?: boolean;
  totalCompletions: number;
}

function HabitRow({
  habit,
  isCompleted,
  streak,
  previousStreak,
  onToggle,
  onDelete,
  onEdit,
  delay,
  onSetReminder,
  onStreakFreeze,
  hasStreakRisk,
  dragHandleRef,
  dragging,
  totalCompletions,
}: HabitRowProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [wasJustCompleted, setWasJustCompleted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);

  const saveNoteMutation = useSaveHabitNote();
  const setReminderMutation = useSetHabitReminderTime();

  const handleToggle = () => {
    if (!isCompleted) {
      setIsFlashing(true);
      setWasJustCompleted(true);
      setTimeout(() => setIsFlashing(false), 700);
      setTimeout(() => {
        setWasJustCompleted(false);
        // Show note dialog after a short delay
        setShowNoteDialog(true);
      }, 800);
    }
    onToggle();
  };

  const handleBellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReminderDialog(true);
  };

  const handleClearReminder = () => {
    if (onSetReminder) onSetReminder(habit.id, "", "");
  };

  const handleSaveNote = (note: string) => {
    if (!note.trim()) return;
    saveNoteMutation.mutate(
      { habitId: habit.id, date: today, note },
      {
        onSuccess: () => toast.success("Note saved!"),
        onError: () => toast.error("Failed to save note."),
      },
    );
  };

  // Local reminder set helper (using mutation directly so we can pass customMsg)
  const handleReminderSet = (time: string, customMsg: string) => {
    setReminderMutation.mutate(
      { habitId: habit.id, reminderTime: time, customMsg },
      {
        onSuccess: () =>
          toast.success(time ? `Reminder set for ${time}` : "Reminder cleared"),
        onError: () => toast.error("Failed to set reminder"),
      },
    );
    // Also call parent callback to keep local state consistent
    if (onSetReminder) onSetReminder(habit.id, time, customMsg);
  };

  const hasReminder = !!habit.reminderTime;
  const diffColor = habit.difficulty
    ? (DIFFICULTY_COLORS[habit.difficulty] ?? "#6b7280")
    : "#6b7280";

  // Check for streak milestone immediately after toggle
  const currentStreakNum = Number(streak.currentStreak);
  const milestoneJustHit =
    STREAK_MILESTONES.includes(currentStreakNum) &&
    previousStreak !== currentStreakNum;

  if (milestoneJustHit) {
    // Fire toast for milestone (check via local ref to avoid re-fires)
    const milestoneKey = `streak-milestone-${habit.id}-${currentStreakNum}`;
    if (!sessionStorage.getItem(milestoneKey)) {
      sessionStorage.setItem(milestoneKey, "1");
      setTimeout(() => {
        toast.success(
          `🔥 ${habit.name} hit a ${currentStreakNum}-day streak!`,
          {
            duration: 6000,
          },
        );
      }, 500);
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: delay * 0.08, ease: "easeOut" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all duration-300",
          isCompleted
            ? "habit-complete border-success/40"
            : "border-border/50 hover:border-border bg-card/30",
          dragging && "opacity-50 scale-95",
        )}
      >
        {/* Flash overlay */}
        {isFlashing && (
          <div className="absolute inset-0 rounded-xl animate-habit-flash pointer-events-none" />
        )}

        {/* Drag handle */}
        <div
          ref={dragHandleRef}
          className="drag-handle hidden sm:flex items-center text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors shrink-0 touch-none select-none"
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </div>

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

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-semibold transition-colors truncate",
              isCompleted ? "text-success/90" : "text-foreground",
            )}
          >
            {habit.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {habit.category && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border"
                style={{
                  backgroundColor: `${CATEGORY_COLORS[habit.category] ?? "#6b7280"}20`,
                  borderColor: `${CATEGORY_COLORS[habit.category] ?? "#6b7280"}40`,
                  color: CATEGORY_COLORS[habit.category] ?? "#6b7280",
                }}
              >
                {habit.category}
              </span>
            )}
            {/* Difficulty badge */}
            {habit.difficulty && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border"
                style={{
                  backgroundColor: `${diffColor}15`,
                  borderColor: `${diffColor}35`,
                  color: diffColor,
                }}
              >
                {habit.difficulty}
              </span>
            )}
            {isCompleted && wasJustCompleted && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-success/70 flex items-center gap-1"
              >
                <Sparkles size={10} />
                Nice work!
              </motion.span>
            )}
            {hasReminder && !wasJustCompleted && (
              <button
                type="button"
                onClick={handleBellClick}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-semibold text-amber-500 hover:bg-amber-500/25 transition-colors cursor-pointer"
              >
                ⏰ {habit.reminderTime}
              </button>
            )}
            {/* Streak at-risk indicator */}
            {hasStreakRisk && !isCompleted && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-[10px] font-semibold text-orange-500">
                ⚠️ Streak at risk!
              </span>
            )}
          </div>
          {/* Goal Progress Bar */}
          <GoalProgressBar habit={habit} completionCount={totalCompletions} />
        </div>

        {/* Streaks + actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5">
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
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
            style={{
              backgroundColor: `${habit.color}22`,
              color: habit.color,
              border: `1px solid ${habit.color}33`,
            }}
          >
            <Trophy size={10} />
            <span>{streak.bestStreak.toString()}d</span>
          </div>

          {/* Streak freeze button */}
          {onStreakFreeze &&
            Number(streak.currentStreak) > 0 &&
            !isCompleted && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStreakFreeze(habit.id);
                }}
                className="hidden sm:flex items-center gap-1 px-1.5 py-1 rounded-lg text-[10px] font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/25 transition-colors shrink-0"
                title="Use streak freeze token"
              >
                <Snowflake size={10} />
                <span>Freeze</span>
              </button>
            )}

          {/* Bell / reminder dialog trigger */}
          {!hasReminder && (
            <button
              type="button"
              onClick={handleBellClick}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-lg transition-colors duration-150 shrink-0",
                "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10",
              )}
              aria-label={`Set reminder for ${habit.name}`}
              title="Set daily reminder"
            >
              <Bell size={14} />
            </button>
          )}

          {/* Edit button */}
          {onEdit && (
            <AnimatePresence>
              {(isHovered || true) && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(habit.id);
                  }}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-150",
                    "sm:opacity-0 sm:group-hover:opacity-100",
                    isHovered ? "opacity-100" : "sm:opacity-0 opacity-100",
                  )}
                  aria-label={`Edit ${habit.name}`}
                >
                  <Pencil size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          )}

          {/* Delete button */}
          {onDelete && (
            <AnimatePresence>
              {(isHovered || true) && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(habit.id);
                  }}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150",
                    isHovered ? "opacity-100" : "sm:opacity-0 opacity-100",
                  )}
                  aria-label={`Delete ${habit.name}`}
                >
                  <Trash2 size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Reminder dialog */}
      <ReminderDialog
        open={showReminderDialog}
        onOpenChange={setShowReminderDialog}
        habitName={habit.name}
        currentTime={habit.reminderTime ?? ""}
        currentCustomMsg={habit.customReminderMsg ?? ""}
        onSet={handleReminderSet}
        onClear={handleClearReminder}
      />

      {/* Note dialog after completion */}
      <NoteDialog
        open={showNoteDialog}
        onOpenChange={setShowNoteDialog}
        habitName={habit.name}
        habitEmoji={habit.emoji}
        date={today}
        onSave={handleSaveNote}
        isSaving={saveNoteMutation.isPending}
      />
    </>
  );
}

// ─── Circular Progress ────────────────────────────────────────────────────────

function CircularProgress({ pct }: { pct: number }) {
  const size = 56;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(var(--muted))"
          strokeWidth={strokeWidth}
          opacity={0.4}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={
            pct === 100 ? "oklch(var(--success))" : "oklch(var(--primary))"
          }
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <span
        className="absolute text-[11px] font-bold tabular-nums"
        style={{
          color:
            pct === 100 ? "oklch(var(--success))" : "oklch(var(--foreground))",
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

// ─── Quick Add Row ────────────────────────────────────────────────────────────

interface QuickAddRowProps {
  onAdd: (name: string, emoji: string) => void;
  isLoading?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
}

function QuickAddRow({ onAdd, isLoading, inputRef }: QuickAddRowProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("⭐");
  const [emojiOpen, setEmojiOpen] = useState(false);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed || isLoading) return;
    onAdd(trimmed, emoji);
    setName("");
    setEmoji("⭐");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-xl border border-dashed border-border/60 bg-muted/10 hover:border-primary/40 transition-colors">
      {/* Emoji picker */}
      <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base hover:bg-muted/50 transition-colors shrink-0 border border-border/40"
            aria-label="Pick emoji"
            title="Pick emoji"
          >
            {emoji}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-48 p-2 bg-popover border-border/60"
          align="start"
        >
          <div className="grid grid-cols-8 gap-1">
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  setEmoji(e);
                  setEmojiOpen(false);
                }}
                className={cn(
                  "w-7 h-7 rounded flex items-center justify-center text-sm hover:bg-muted/60 transition-colors",
                  emoji === e && "bg-primary/20 ring-1 ring-primary/50",
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 30))}
        onKeyDown={handleKeyDown}
        placeholder="Quick-add habit… (press / to focus)"
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none min-w-0"
        aria-label="Quick-add habit name"
        disabled={isLoading}
      />

      {/* Add button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!name.trim() || isLoading}
        className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0",
          name.trim() && !isLoading
            ? "bg-primary text-primary-foreground hover:bg-primary/90 scale-100 hover:scale-105"
            : "bg-muted/30 text-muted-foreground/40 cursor-not-allowed",
        )}
        aria-label="Add habit"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

// ─── HabitList ────────────────────────────────────────────────────────────────

interface HabitListProps {
  habits: Habit[];
  streaks: Array<[Habit, StreakData]>;
  completedToday: Set<string>;
  completions?: Array<[Habit, Array<string>]>;
  onToggle: (habitId: bigint) => void;
  onDelete?: (habitId: bigint) => void;
  onEdit?: (habitId: bigint) => void;
  onSetReminder?: (habitId: bigint, time: string, customMsg?: string) => void;
  onAddFirst?: () => void;
  onQuickAdd?: (name: string, emoji: string) => void;
  onCompleteAll?: () => void;
  onStreakFreeze?: (habitId: bigint) => void;
  streakRiskHabitIds?: Set<string>;
  isQuickAddLoading?: boolean;
  quickAddInputRef?: RefObject<HTMLInputElement | null>;
  habitOrder?: bigint[];
  onReorder?: (newOrder: bigint[]) => void;
  weeklyChallenge?: WeeklyChallenge | null;
}

export function HabitList({
  habits,
  streaks,
  completedToday,
  completions = [],
  onToggle,
  onDelete,
  onEdit,
  onSetReminder,
  onAddFirst,
  onQuickAdd,
  onCompleteAll,
  onStreakFreeze,
  streakRiskHabitIds,
  isQuickAddLoading,
  quickAddInputRef,
  habitOrder,
  onReorder,
  weeklyChallenge,
}: HabitListProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");

  // Build total completions count per habit (all time)
  const totalCompletionsMap = new Map<string, number>();
  for (const [h, dates] of completions) {
    totalCompletionsMap.set(h.id.toString(), dates.length);
  }

  // Apply habit order from profile
  const orderedHabits =
    habitOrder && habitOrder.length > 0
      ? (() => {
          const habitMap = new Map(habits.map((h) => [h.id.toString(), h]));
          const ordered: Habit[] = [];
          for (const id of habitOrder) {
            const h = habitMap.get(id.toString());
            if (h) ordered.push(h);
          }
          for (const h of habits) {
            if (!habitOrder.some((id) => id.toString() === h.id.toString())) {
              ordered.push(h);
            }
          }
          return ordered;
        })()
      : habits;

  const streakMap = new Map(streaks.map(([h, s]) => [h.id.toString(), s]));

  // Previous streak values for milestone detection
  const prevStreakRef = useRef<Map<string, number>>(new Map());
  const prevStreakMap = new Map<string, number>();
  for (const [h, s] of streaks) {
    const key = h.id.toString();
    prevStreakMap.set(
      key,
      prevStreakRef.current.get(key) ?? Number(s.currentStreak),
    );
    prevStreakRef.current.set(key, Number(s.currentStreak));
  }

  const completionCount = habits.filter((h) =>
    completedToday.has(h.id.toString()),
  ).length;
  const completionPct =
    habits.length > 0 ? Math.round((completionCount / habits.length) * 100) : 0;

  const filteredHabits =
    categoryFilter === "All"
      ? orderedHabits
      : orderedHabits.filter((h) => (h.category || "Other") === categoryFilter);

  const incompleteCount = filteredHabits.filter(
    (h) => !completedToday.has(h.id.toString()),
  ).length;

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, habitId: string) => {
    setDraggedId(habitId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, habitId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (habitId !== draggedId) setDragOverId(habitId);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const currentList = filteredHabits;
    const fromIdx = currentList.findIndex((h) => h.id.toString() === draggedId);
    const toIdx = currentList.findIndex((h) => h.id.toString() === targetId);

    if (fromIdx === -1 || toIdx === -1) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const newList = [...currentList];
    const [moved] = newList.splice(fromIdx, 1);
    newList.splice(toIdx, 0, moved);

    if (onReorder) {
      onReorder(newList.map((h) => h.id));
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // Categories present in actual habits
  const presentCategories = new Set(habits.map((h) => h.category || "Other"));
  const availableFilters = ALL_CATEGORIES.filter(
    (c) => c === "All" || presentCategories.has(c),
  );

  // Empty state
  if (habits.length === 0) {
    return (
      <div className="space-y-3">
        {weeklyChallenge && <ChallengeBanner challenge={weeklyChallenge} />}
        {onQuickAdd && (
          <QuickAddRow
            onAdd={onQuickAdd}
            isLoading={isQuickAddLoading}
            inputRef={quickAddInputRef}
          />
        )}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-12 text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center">
            <ClipboardList size={28} className="text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              No habits yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Start building great habits — add your first one above or click
              the button!
            </p>
          </div>
          {onAddFirst && (
            <Button
              onClick={onAddFirst}
              size="sm"
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus size={14} />
              Add Your First Habit
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Weekly Challenge Banner */}
      {weeklyChallenge && <ChallengeBanner challenge={weeklyChallenge} />}

      {/* Header with circular progress ring + Complete All */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            {completionCount} of {habits.length} completed
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completionPct === 100
              ? "🎉 All done for today!"
              : completionPct >= 50
                ? "Great progress, keep going!"
                : "Keep going, you've got this!"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Complete All button */}
          {onCompleteAll && incompleteCount > 0 && (
            <button
              type="button"
              onClick={onCompleteAll}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-success/30 bg-success/10 text-success hover:bg-success/20 transition-colors"
              title={`Complete all ${incompleteCount} remaining habits`}
            >
              <CheckCheck size={13} />
              Complete All
            </button>
          )}
          <CircularProgress pct={completionPct} />
        </div>
      </div>

      {/* Quick-add row */}
      {onQuickAdd && (
        <QuickAddRow
          onAdd={onQuickAdd}
          isLoading={isQuickAddLoading}
          inputRef={quickAddInputRef}
        />
      )}

      {/* Mobile Complete All */}
      {onCompleteAll && incompleteCount > 0 && (
        <button
          type="button"
          onClick={onCompleteAll}
          className="sm:hidden w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-success/30 bg-success/10 text-success hover:bg-success/20 transition-colors"
        >
          <CheckCheck size={13} />
          Complete All ({incompleteCount} remaining)
        </button>
      )}

      {/* Category filter tabs */}
      {availableFilters.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {availableFilters.map((cat) => {
            const isActive = categoryFilter === cat;
            const color = cat === "All" ? null : CATEGORY_COLORS[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-150",
                  isActive
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/40 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
                style={
                  isActive && color
                    ? {
                        borderColor: `${color}60`,
                        backgroundColor: `${color}15`,
                        color: color,
                      }
                    : undefined
                }
              >
                {color && (
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: isActive ? color : undefined }}
                  />
                )}
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Habit rows */}
      <div className="space-y-2">
        {filteredHabits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No {categoryFilter} habits yet
            </p>
          </div>
        ) : (
          filteredHabits.map((habit, i) => (
            <div
              key={habit.id.toString()}
              draggable={!!onReorder}
              onDragStart={(e) => handleDragStart(e, habit.id.toString())}
              onDragOver={(e) => handleDragOver(e, habit.id.toString())}
              onDrop={(e) => handleDrop(e, habit.id.toString())}
              onDragEnd={handleDragEnd}
              className={cn(
                "transition-all duration-150",
                dragOverId === habit.id.toString() &&
                  draggedId !== habit.id.toString() &&
                  "border-t-2 border-primary/60",
              )}
            >
              <HabitRow
                habit={habit}
                isCompleted={completedToday.has(habit.id.toString())}
                streak={
                  streakMap.get(habit.id.toString()) ?? {
                    currentStreak: 0n,
                    bestStreak: 0n,
                  }
                }
                previousStreak={prevStreakMap.get(habit.id.toString()) ?? 0}
                onToggle={() => onToggle(habit.id)}
                onDelete={onDelete}
                onEdit={onEdit}
                delay={i}
                onSetReminder={onSetReminder}
                onStreakFreeze={onStreakFreeze}
                hasStreakRisk={streakRiskHabitIds?.has(habit.id.toString())}
                dragging={draggedId === habit.id.toString()}
                totalCompletions={
                  totalCompletionsMap.get(habit.id.toString()) ?? 0
                }
              />
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground/60">
          💡 Drag to reorder • Click checkbox to toggle • Press / for quick-add
        </p>
      </div>
    </div>
  );
}
