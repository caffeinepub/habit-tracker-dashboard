import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { Habit } from "../backend.d";

export interface ReminderFiredEvent {
  habitId: string;
  habitName: string;
  habitEmoji: string;
  customMsg?: string;
}

/** Plays a pleasant 3-note chime using the Web Audio API */
function playReminderChime() {
  try {
    const ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();

    // Three ascending notes: C5 → E5 → G5
    const notes = [523.25, 659.25, 783.99];
    const noteDuration = 0.18; // seconds each
    const gap = 0.05;

    notes.forEach((freq, i) => {
      const startTime = ctx.currentTime + i * (noteDuration + gap);

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      // Smooth attack + decay envelope
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.35, startTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + noteDuration,
      );

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });

    // Close context after all notes finish
    setTimeout(
      () => ctx.close(),
      (notes.length * (noteDuration + gap) + 0.5) * 1000,
    );
  } catch {
    // Silently ignore if Web Audio API is not supported
  }
}

export function useReminderScheduler(habits: Habit[]) {
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Track which habits have already fired today so we don't double-trigger
  const firedTodayRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Clear previous timers
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];

    const now = new Date();
    const todayKey = now.toDateString();

    // Reset fired set if day has changed
    const firedKey = "__reminderFiredDate__";
    const storedDate = sessionStorage.getItem(firedKey);
    if (storedDate !== todayKey) {
      firedTodayRef.current = new Set();
      sessionStorage.setItem(firedKey, todayKey);
    }

    for (const habit of habits) {
      if (!habit.reminderTime) continue;
      const [hours, minutes] = habit.reminderTime.split(":").map(Number);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) continue;

      const reminderDate = new Date();
      reminderDate.setHours(hours, minutes, 0, 0);

      // If the time has already passed today, skip
      if (reminderDate <= now) continue;

      // Don't schedule if already fired this session
      const habitKey = `${habit.id.toString()}-${habit.reminderTime}`;
      if (firedTodayRef.current.has(habitKey)) continue;

      const msUntilReminder = reminderDate.getTime() - now.getTime();

      const timer = setTimeout(() => {
        firedTodayRef.current.add(habitKey);

        // Play chime sound
        playReminderChime();

        // Request browser notification permission if not yet asked
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission();
        }

        // Fire custom event so App.tsx can show the prominent 2-minute banner
        window.dispatchEvent(
          new CustomEvent<ReminderFiredEvent>("habitReminderFired", {
            detail: {
              habitId: habit.id.toString(),
              habitName: habit.name,
              habitEmoji: habit.emoji,
              customMsg: habit.customReminderMsg || undefined,
            },
          }),
        );

        const reminderText =
          habit.customReminderMsg || `Time to complete "${habit.name}"!`;

        // Also show a toast for quick visibility (2 minutes duration)
        toast(`${habit.emoji} Habit Reminder`, {
          description: reminderText,
          duration: 120_000, // 2 minutes
          action: {
            label: "Mark Done",
            onClick: () => {
              window.dispatchEvent(
                new CustomEvent("habitReminderMarkDone", {
                  detail: { habitId: habit.id.toString() },
                }),
              );
            },
          },
        });

        // Browser notification if permission is granted
        if ("Notification" in window && Notification.permission === "granted") {
          const n = new Notification("HabitFlow Reminder", {
            body: `Time to complete "${habit.name}"! ${habit.emoji}`,
            icon: "/favicon.ico",
          });
          n.onclick = () => {
            window.focus();
          };
        }
      }, msUntilReminder);

      timerRefs.current.push(timer);
    }

    return () => {
      timerRefs.current.forEach(clearTimeout);
      timerRefs.current = [];
    };
  }, [habits]);
}
