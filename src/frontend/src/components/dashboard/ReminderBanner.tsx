import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReminderFiredEvent } from "../../hooks/useReminderScheduler";

// Duration in ms that each banner stays visible
const BANNER_DURATION = 120_000; // 2 minutes

export interface ActiveReminder {
  id: string; // unique per fire: habitId + timestamp
  habitId: string;
  habitName: string;
  habitEmoji: string;
  customMsg?: string;
  firedAt: number;
}

interface ReminderBannerItemProps {
  reminder: ActiveReminder;
  onDismiss: (id: string) => void;
  onMarkDone: (habitId: string, bannerId: string) => void;
  onSnooze: (
    bannerId: string,
    habitId: string,
    habitName: string,
    habitEmoji: string,
  ) => void;
}

function ReminderBannerItem({
  reminder,
  onDismiss,
  onMarkDone,
  onSnooze,
}: ReminderBannerItemProps) {
  const [timeLeft, setTimeLeft] = useState(BANNER_DURATION);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Countdown tick
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - reminder.firedAt;
      const remaining = Math.max(0, BANNER_DURATION - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        onDismiss(reminder.id);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reminder.id, reminder.firedAt, onDismiss]);

  const minutesLeft = Math.floor(timeLeft / 60000);
  const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
  const progressPct = (timeLeft / BANNER_DURATION) * 100;

  return (
    <motion.div
      key={reminder.id}
      initial={{ opacity: 0, y: -16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="relative overflow-hidden rounded-xl shadow-lg"
      style={{
        background: "oklch(var(--card))",
        border: "1.5px solid oklch(0.82 0.18 85 / 0.7)",
        boxShadow:
          "0 0 0 1px oklch(0.82 0.18 85 / 0.15), 0 4px 20px oklch(0.82 0.18 85 / 0.18)",
      }}
    >
      {/* Pulsing amber glow ring */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{
          duration: 1.8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{
          boxShadow: "inset 0 0 0 1.5px oklch(0.82 0.18 85 / 0.5)",
        }}
      />

      {/* Progress bar (drains left-to-right) */}
      <div
        className="absolute top-0 left-0 h-1 rounded-t-xl transition-all duration-1000"
        style={{
          width: `${progressPct}%`,
          background:
            "linear-gradient(90deg, oklch(0.75 0.2 50), oklch(0.82 0.18 85))",
        }}
      />

      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        {/* Emoji with bounce */}
        <motion.span
          className="text-2xl leading-none mt-0.5 shrink-0"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{
            duration: 1.2,
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 2,
          }}
        >
          {reminder.habitEmoji}
        </motion.span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
              style={{
                background: "oklch(0.82 0.18 85 / 0.15)",
                color: "oklch(0.72 0.18 75)",
              }}
            >
              ⏰ Reminder
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
              {minutesLeft > 0
                ? `${minutesLeft}m ${secondsLeft}s`
                : `${secondsLeft}s`}
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">
            {reminder.customMsg ? (
              reminder.customMsg
            ) : (
              <>
                Time to complete{" "}
                <span style={{ color: "oklch(0.72 0.18 75)" }}>
                  {reminder.habitName}
                </span>
                !
              </>
            )}
          </p>
        </div>

        {/* Dismiss X */}
        <button
          type="button"
          onClick={() => onDismiss(reminder.id)}
          aria-label="Dismiss reminder"
          className="shrink-0 p-1 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onMarkDone(reminder.habitId, reminder.id)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
          style={{
            background: "oklch(0.52 0.15 145)",
            color: "white",
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M1 6l3.5 4 6.5-8" />
          </svg>
          Mark Done
        </button>
        <button
          type="button"
          onClick={() =>
            onSnooze(
              reminder.id,
              reminder.habitId,
              reminder.habitName,
              reminder.habitEmoji,
            )
          }
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
          title="Remind me in 30 minutes"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="6" cy="6" r="5" />
            <path d="M6 3v3l2 2" />
          </svg>
          Snooze 30m
        </button>
        <button
          type="button"
          onClick={() => onDismiss(reminder.id)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </motion.div>
  );
}

interface ReminderBannersProps {
  onMarkDone: (habitId: string) => void;
}

export function ReminderBanners({ onMarkDone }: ReminderBannersProps) {
  const [reminders, setReminders] = useState<ActiveReminder[]>([]);
  const snoozeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const handleDismiss = useCallback((id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleMarkDone = useCallback(
    (habitId: string, bannerId: string) => {
      onMarkDone(habitId);
      handleDismiss(bannerId);
    },
    [onMarkDone, handleDismiss],
  );

  const handleSnooze = useCallback(
    (
      bannerId: string,
      habitId: string,
      habitName: string,
      habitEmoji: string,
    ) => {
      handleDismiss(bannerId);
      // Re-fire after 30 minutes
      const timer = setTimeout(
        () => {
          const newId = `${habitId}-snooze-${Date.now()}`;
          setReminders((prev) => [
            ...prev,
            {
              id: newId,
              habitId,
              habitName,
              habitEmoji,
              firedAt: Date.now(),
            },
          ]);
        },
        30 * 60 * 1000,
      );
      snoozeTimersRef.current.push(timer);
    },
    [handleDismiss],
  );

  useEffect(() => {
    return () => {
      for (const t of snoozeTimersRef.current) clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ReminderFiredEvent>).detail;
      if (!detail?.habitId) return;

      const id = `${detail.habitId}-${Date.now()}`;
      const newReminder: ActiveReminder = {
        id,
        habitId: detail.habitId,
        habitName: detail.habitName,
        habitEmoji: detail.habitEmoji,
        customMsg: detail.customMsg,
        firedAt: Date.now(),
      };

      setReminders((prev) => {
        // Avoid stacking duplicate banners for the same habit within 5s
        const recent = prev.find(
          (r) => r.habitId === detail.habitId && Date.now() - r.firedAt < 5000,
        );
        if (recent) return prev;
        return [...prev, newReminder];
      });
    };

    window.addEventListener("habitReminderFired", handler);
    return () => window.removeEventListener("habitReminderFired", handler);
  }, []);

  if (reminders.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
      role="alert"
      aria-live="assertive"
    >
      <AnimatePresence mode="sync">
        {reminders.map((reminder) => (
          <ReminderBannerItem
            key={reminder.id}
            reminder={reminder}
            onDismiss={handleDismiss}
            onMarkDone={handleMarkDone}
            onSnooze={handleSnooze}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
