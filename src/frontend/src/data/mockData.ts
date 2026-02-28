import { addDays, format, subDays } from "date-fns";

export interface HabitMock {
  id: bigint;
  name: string;
  emoji: string;
  color: string;
}

export interface StreakMock {
  currentStreak: bigint;
  bestStreak: bigint;
}

export const MOCK_HABITS: HabitMock[] = [
  { id: 1n, name: "Drink Water", emoji: "💧", color: "#3b82f6" },
  { id: 2n, name: "Exercise", emoji: "🏃", color: "#f97316" },
  { id: 3n, name: "Read", emoji: "📚", color: "#a855f7" },
  { id: 4n, name: "Meditate", emoji: "🧘", color: "#14b8a6" },
  { id: 5n, name: "Sleep 8hrs", emoji: "😴", color: "#6366f1" },
];

// Generate realistic completion data for past 28 days + today
function generateCompletionDates(habitId: bigint, today: Date): string[] {
  const dates: string[] = [];
  const completionRates: Record<string, number> = {
    "1": 0.85, // Drink Water - high consistency
    "2": 0.6, // Exercise - moderate
    "3": 0.7, // Read
    "4": 0.55, // Meditate - inconsistent
    "5": 0.75, // Sleep 8hrs
  };

  const rate = completionRates[habitId.toString()] ?? 0.65;

  // Use a seeded-ish approach for consistent "random" data
  const seed = Number(habitId) * 17;

  for (let i = 27; i >= 0; i--) {
    const date = subDays(today, i);
    const dayOfWeek = date.getDay();

    // Vary rates by day of week
    let dayRate = rate;
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekends slightly lower for exercise, higher for reading
      if (habitId === 2n) dayRate *= 0.7;
      if (habitId === 3n) dayRate *= 1.2;
    }

    // Simulate streaks and gaps using pseudo-random
    const pseudoRandom = ((seed + i * 31 + i * i * 7) % 100) / 100;
    if (pseudoRandom < Math.min(dayRate, 0.95)) {
      dates.push(format(date, "yyyy-MM-dd"));
    }
  }

  return dates;
}

export function generateMockCompletions(today: Date): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const habit of MOCK_HABITS) {
    map.set(habit.id.toString(), generateCompletionDates(habit.id, today));
  }
  return map;
}

export function getMockStreaks(
  completions: Map<string, string[]>,
  today: Date,
): Map<string, StreakMock> {
  const streaks = new Map<string, StreakMock>();

  for (const habit of MOCK_HABITS) {
    const dates = completions.get(habit.id.toString()) ?? [];
    const dateSet = new Set(dates);

    let currentStreak = 0;
    let bestStreak = 0;

    // Calculate current streak (going backwards from today)
    for (let i = 0; i <= 27; i++) {
      const d = format(subDays(today, i), "yyyy-MM-dd");
      if (dateSet.has(d)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate best streak
    let streak = 0;
    for (let i = 27; i >= 0; i--) {
      const d = format(subDays(today, i), "yyyy-MM-dd");
      if (dateSet.has(d)) {
        streak++;
        bestStreak = Math.max(bestStreak, streak);
      } else {
        streak = 0;
      }
    }

    streaks.set(habit.id.toString(), {
      currentStreak: BigInt(currentStreak),
      bestStreak: BigInt(Math.max(bestStreak, currentStreak)),
    });
  }

  return streaks;
}

export function getWeekDays(today: Date): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    format(subDays(today, 6 - i), "yyyy-MM-dd"),
  );
}

export function getWeeklyCompletionData(
  completions: Map<string, string[]>,
  today: Date,
): Array<{ week: string; [habitName: string]: string | number }> {
  const habits = MOCK_HABITS;
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const weekStart = subDays(today, (3 - i) * 7 + 6);
    const weekEnd = subDays(today, (3 - i) * 7);
    return { start: weekStart, end: weekEnd, label: `Week ${i + 1}` };
  });

  return weeks.map(({ start, label }) => {
    const data: { week: string; [key: string]: string | number } = {
      week: label,
    };

    for (const habit of habits) {
      const dates = completions.get(habit.id.toString()) ?? [];
      const dateSet = new Set(dates);
      let completed = 0;
      const total = 7;

      for (let d = 0; d < 7; d++) {
        const date = format(addDays(start, d), "yyyy-MM-dd");
        if (dateSet.has(date)) completed++;
      }

      data[habit.name] = Math.round((completed / total) * 100);
    }

    return data;
  });
}

export function getDailyCompletionData(
  completions: Map<string, string[]>,
  today: Date,
): Array<{ day: string; completion: number }> {
  return Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayLabel = format(date, "EEE");

    let completed = 0;
    for (const habit of MOCK_HABITS) {
      const dates = completions.get(habit.id.toString()) ?? [];
      if (dates.includes(dateStr)) completed++;
    }

    return {
      day: dayLabel,
      completion: Math.round((completed / MOCK_HABITS.length) * 100),
    };
  });
}
