import { Button } from "@/components/ui/button";
import { format, subDays } from "date-fns";
import {
  Award,
  BarChart2,
  CalendarDays,
  CheckCircle2,
  Download,
  Flame,
  Link2,
  Star,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useGetCompletions,
  useGetDetailedStats,
  useGetMoods,
} from "../../hooks/useQueries";

const today = format(new Date(), "yyyy-MM-dd");
const yearStart = format(subDays(new Date(), 364), "yyyy-MM-dd");
const thirtyDaysAgo = format(subDays(new Date(), 29), "yyyy-MM-dd");

// ─── Animated Number ──────────────────────────────────────────────────────────

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  duration?: number;
}

function AnimatedNumber({
  value,
  suffix = "",
  duration = 1200,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    startRef.current = null;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span className="tabular-nums">
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  description: string;
  accent: string;
  index: number;
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  description,
  accent,
  index,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: "easeOut" }}
      className="card-surface rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-8 translate-x-8 pointer-events-none"
        style={{ backgroundColor: accent }}
      />

      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          backgroundColor: `${accent}20`,
          border: `1px solid ${accent}30`,
        }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>

      <div>
        <p className="text-3xl font-bold text-foreground leading-none">
          <AnimatedNumber value={value} suffix={suffix} />
        </p>
        <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
          {label}
        </p>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

// ─── Habit Heatmap ────────────────────────────────────────────────────────────

interface HeatmapCellData {
  date: string;
  count: number;
  total: number;
}

function HabitHeatmap() {
  const { data: completions = [] } = useGetCompletions(yearStart, today);

  const dateMap = new Map<string, { completed: number; total: number }>();

  for (const [, dates] of completions) {
    for (const date of dates) {
      const prev = dateMap.get(date) ?? { completed: 0, total: 0 };
      dateMap.set(date, { completed: prev.completed + 1, total: prev.total });
    }
  }

  const totalHabits = completions.length;

  const cells: HeatmapCellData[] = [];
  for (let i = 364; i >= 0; i--) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    const data = dateMap.get(date);
    cells.push({
      date,
      count: data?.completed ?? 0,
      total: totalHabits,
    });
  }

  const weeks: HeatmapCellData[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const getColor = (count: number, total: number) => {
    if (count === 0 || total === 0) return "oklch(0.2 0.03 265 / 0.5)";
    const pct = count / total;
    if (pct >= 1) return "oklch(0.65 0.2 155)";
    if (pct >= 0.5) return "oklch(0.55 0.18 155 / 0.8)";
    return "oklch(0.45 0.14 155 / 0.5)";
  };

  const monthLabels: { label: string; weekIdx: number }[] = [];
  let lastMonth = "";
  weeks.forEach((week, weekIdx) => {
    const firstDay = week[0];
    if (firstDay) {
      const month = format(new Date(firstDay.date), "MMM");
      if (month !== lastMonth) {
        monthLabels.push({ label: month, weekIdx });
        lastMonth = month;
      }
    }
  });

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="card-surface rounded-2xl p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Activity Heatmap
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last 52 weeks of habit completions
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <div
              key={pct}
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor:
                  pct === 0
                    ? "oklch(0.2 0.03 265 / 0.5)"
                    : pct >= 1
                      ? "oklch(0.65 0.2 155)"
                      : pct >= 0.5
                        ? "oklch(0.55 0.18 155 / 0.8)"
                        : "oklch(0.45 0.14 155 / 0.5)",
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div
            className="flex gap-0.5 mb-1 pl-6"
            style={{ paddingLeft: "1.5rem" }}
          >
            {weeks.map((_, weekIdx) => {
              const label = monthLabels.find((m) => m.weekIdx === weekIdx);
              const weekStartDate =
                cells[weekIdx * 7]?.date ?? `week-${weekIdx}`;
              return (
                <div
                  key={weekStartDate}
                  className="w-3 text-[9px] text-muted-foreground/60 shrink-0"
                  style={{ width: "0.75rem" }}
                >
                  {label?.label ?? ""}
                </div>
              );
            })}
          </div>

          <div className="flex gap-0.5">
            <div className="flex flex-col gap-0.5 mr-1">
              {dayLabels.map((label, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: day labels are static
                  key={i}
                  className="h-3 flex items-center text-[9px] text-muted-foreground/60"
                  style={{ height: "0.75rem" }}
                >
                  {label}
                </div>
              ))}
            </div>

            {weeks.map((week, weekIdx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: week index is appropriate for heatmap columns
                key={weekIdx}
                className="flex flex-col gap-0.5"
              >
                {week.map((cell) => (
                  <div
                    key={cell.date}
                    className="heatmap-cell w-3 h-3 rounded-sm cursor-pointer"
                    style={{
                      width: "0.75rem",
                      height: "0.75rem",
                      backgroundColor: getColor(cell.count, cell.total),
                    }}
                    title={`${cell.date}: ${cell.count}/${cell.total} habits`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Mood History ─────────────────────────────────────────────────────────────

const MOOD_MAP: Record<
  string,
  { emoji: string; label: string; color: string }
> = {
  rough: { emoji: "😔", label: "Rough", color: "#6b7280" },
  tough: { emoji: "😕", label: "Tough", color: "#f97316" },
  okay: { emoji: "😐", label: "Okay", color: "#eab308" },
  good: { emoji: "😊", label: "Good", color: "#22c55e" },
  amazing: { emoji: "😄", label: "Amazing", color: "#3b82f6" },
};

function MoodHistory() {
  const { data: moods = [] } = useGetMoods();

  if (moods.length === 0) return null;

  const sorted = [...moods]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 30);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="card-surface rounded-2xl p-5 space-y-3"
    >
      <div>
        <h3 className="text-sm font-bold text-foreground">Mood History</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your mood on days when all habits were completed
        </p>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {sorted.map(([date, mood]) => {
          const moodInfo = MOOD_MAP[mood];
          if (!moodInfo) return null;
          return (
            <div
              key={date}
              title={`${date}: ${moodInfo.label}`}
              className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/30 transition-colors cursor-default"
            >
              <span className="text-xl leading-none">{moodInfo.emoji}</span>
              <span className="text-[9px] text-muted-foreground">
                {format(new Date(`${date}T00:00:00`), "MMM d")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mood distribution */}
      <div className="flex flex-wrap gap-2 pt-1">
        {Object.entries(MOOD_MAP).map(([key, info]) => {
          const count = moods.filter(([, m]) => m === key).length;
          if (count === 0) return null;
          return (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
              style={{
                backgroundColor: `${info.color}15`,
                borderColor: `${info.color}30`,
                color: info.color,
              }}
            >
              {info.emoji} {info.label} × {count}
            </span>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Habit Correlation ────────────────────────────────────────────────────────

function HabitCorrelation() {
  const { data: completions30 = [] } = useGetCompletions(thirtyDaysAgo, today);

  if (completions30.length < 2) return null;

  // Build correlation: for each pair, count days both were done
  const pairs: Array<{ habitA: string; habitB: string; count: number }> = [];

  const habits = completions30.map(([h, dates]) => ({
    id: h.id.toString(),
    name: h.name,
    emoji: h.emoji,
    dateSet: new Set(dates),
  }));

  // Collect all dates
  const allDates: string[] = [];
  for (let i = 29; i >= 0; i--) {
    allDates.push(format(subDays(new Date(), i), "yyyy-MM-dd"));
  }

  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const hA = habits[i];
      const hB = habits[j];
      let bothCount = 0;
      for (const date of allDates) {
        if (hA.dateSet.has(date) && hB.dateSet.has(date)) bothCount++;
      }
      if (bothCount > 3) {
        pairs.push({
          habitA: `${hA.emoji} ${hA.name}`,
          habitB: `${hB.emoji} ${hB.name}`,
          count: bothCount,
        });
      }
    }
  }

  if (pairs.length === 0) return null;

  const topPairs = pairs.sort((a, b) => b.count - a.count).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="card-surface rounded-2xl p-5 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Link2 size={16} className="text-primary" />
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Habit Correlation
          </h3>
          <p className="text-xs text-muted-foreground">
            Habits you often complete together (last 30 days)
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {topPairs.map((pair, i) => (
          <div
            key={`${pair.habitA}-${pair.habitB}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/40"
          >
            <span
              className="text-lg font-bold text-primary shrink-0"
              style={{ opacity: 1 - i * 0.2 }}
            >
              #{i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">
                You often do <span className="text-primary">{pair.habitA}</span>{" "}
                with <span className="text-primary">{pair.habitB}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Done together on {pair.count} days this month
              </p>
            </div>
            <div className="shrink-0 text-xs font-bold text-success">
              {pair.count}d
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── CSV Export ────────────────────────────────────────────────────────────────

function exportHabitsCSV(
  completions: Array<
    [{ name: string; emoji: string; id: bigint }, Array<string>]
  >,
) {
  const rows: string[][] = [["Habit Name", "Emoji", "Date"]];
  for (const [habit, dates] of completions) {
    for (const date of dates.sort()) {
      rows.push([habit.name, habit.emoji, date]);
    }
  }
  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `habitflow-data-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── DetailedStatsPage ────────────────────────────────────────────────────────

export function DetailedStatsPage() {
  const { data: stats, isLoading } = useGetDetailedStats(today);
  const { data: completionsYear = [] } = useGetCompletions(yearStart, today);

  const statCards: StatCardProps[] = stats
    ? [
        {
          icon: <CheckCircle2 size={18} />,
          label: "Total Completions",
          value: Number(stats.totalCompletions),
          suffix: "",
          description:
            "All-time habit check-ins across every habit you've tracked",
          accent: "#22c55e",
          index: 0,
        },
        {
          icon: <Award size={18} />,
          label: "Best Streak Ever",
          value: Number(stats.bestStreakEver),
          suffix: " days",
          description: "Your longest continuous streak across all habits",
          accent: "#f59e0b",
          index: 1,
        },
        {
          icon: <TrendingUp size={18} />,
          label: "Avg. Completion Rate",
          value: Number(stats.averageCompletionRate),
          suffix: "%",
          description: "Average daily completion rate over the last 30 days",
          accent: "#3b82f6",
          index: 2,
        },
        {
          icon: <CalendarDays size={18} />,
          label: "Total Days Tracked",
          value: Number(stats.totalDaysTracked),
          suffix: " days",
          description: "Number of unique days you've logged at least one habit",
          accent: "#8b5cf6",
          index: 3,
        },
        {
          icon: <Star size={18} />,
          label: "Habits Completed Today",
          value: Number(stats.habitsCompletedToday),
          suffix: "",
          description: "How many habits you've checked off so far today",
          accent: "#ec4899",
          index: 4,
        },
        {
          icon: <Flame size={18} />,
          label: "Current Streak",
          value: Number(stats.currentStreakDays),
          suffix: " days",
          description: "How many consecutive days you've logged any habits",
          accent: "#ef4444",
          index: 5,
        },
      ]
    : [];

  const handleExportCSV = () => {
    if (completionsYear.length === 0) {
      toast.error("No data to export yet.");
      return;
    }
    exportHabitsCSV(completionsYear);
    toast.success("CSV exported!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
            Statistics
          </span>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Detailed Stats
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Deep dive into your habit performance over time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center gap-2 border-border/50 hover:border-primary/40 text-xs"
            >
              <Download size={13} />
              Export CSV
            </Button>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl card-surface">
              <BarChart2 size={16} className="text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">
                {format(new Date(), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
              key={i}
              className="rounded-2xl bg-muted/20 animate-pulse h-40"
            />
          ))}
        </div>
      ) : !stats ? (
        <div className="card-surface rounded-2xl flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mb-4 text-3xl">
            📊
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            No stats yet
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Start tracking habits to see your detailed statistics here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      )}

      {/* Heatmap */}
      <HabitHeatmap />

      {/* Mood History */}
      <MoodHistory />

      {/* Habit Correlation */}
      <HabitCorrelation />
    </div>
  );
}
