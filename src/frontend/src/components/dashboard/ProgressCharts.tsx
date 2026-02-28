import { addDays, format, subDays } from "date-fns";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import type { Habit } from "../../backend.d";

interface ProgressChartsProps {
  habits: Habit[];
  completions: Array<[Habit, Array<string>]>;
}

// Custom tooltip styles
function CustomBarTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-card text-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
}

function CustomAreaTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-card text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-muted-foreground">Completion:</span>
        <span className="font-semibold text-foreground">
          {payload[0]?.value}%
        </span>
      </div>
    </div>
  );
}

export function ProgressCharts({ habits, completions }: ProgressChartsProps) {
  const today = new Date();

  // Build weekly completion data for past 4 weeks
  const weeklyData = Array.from({ length: 4 }, (_, weekIdx) => {
    const weekStart = subDays(today, (3 - weekIdx) * 7 + 6);
    const data: Record<string, number | string> = {
      week: `Week ${weekIdx + 1}`,
    };

    for (const [habit, dates] of completions) {
      const dateSet = new Set(dates);
      let completed = 0;
      for (let d = 0; d < 7; d++) {
        const date = format(addDays(weekStart, d), "yyyy-MM-dd");
        if (dateSet.has(date)) completed++;
      }
      data[habit.name] = Math.round((completed / 7) * 100);
    }
    return data;
  });

  // Build daily completion data for past 7 days
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayLabel = format(date, "EEE");

    let completed = 0;
    for (const [, dates] of completions) {
      if (dates.includes(dateStr)) completed++;
    }

    return {
      day: dayLabel,
      completion:
        completions.length > 0
          ? Math.round((completed / completions.length) * 100)
          : 0,
    };
  });

  // Habit colors for charts
  const habitColors = habits.map((h) => h.color);

  const chartStyle = {
    fontSize: "11px",
    fontFamily: "inherit",
  };

  return (
    <div className="space-y-8">
      {/* Grouped bar chart - 4 weeks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Monthly Overview
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Completion % per habit over 4 weeks
            </p>
          </div>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} barGap={2} barCategoryGap="30%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.3 0.04 265 / 0.2)"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{ ...chartStyle, fill: "oklch(0.55 0.04 265)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ ...chartStyle, fill: "oklch(0.55 0.04 265)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                width={36}
              />
              <Tooltip
                content={<CustomBarTooltip />}
                cursor={{ fill: "oklch(1 0 0 / 0.03)" }}
              />
              <Legend
                wrapperStyle={{
                  ...chartStyle,
                  color: "oklch(0.7 0.03 265)",
                  paddingTop: "12px",
                }}
                iconType="circle"
                iconSize={8}
              />
              {habits.map((habit, i) => (
                <Bar
                  key={habit.id.toString()}
                  dataKey={habit.name}
                  fill={habitColors[i] ?? "#888"}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Area chart - 7 days */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Daily Completion Trend
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Overall completion % for the past 7 days
            </p>
          </div>
        </div>

        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient
                  id="colorCompletion"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="oklch(0.62 0.22 290)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="oklch(0.62 0.22 290)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.3 0.04 265 / 0.2)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ ...chartStyle, fill: "oklch(0.55 0.04 265)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ ...chartStyle, fill: "oklch(0.55 0.04 265)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                width={36}
              />
              <Tooltip
                content={<CustomAreaTooltip />}
                cursor={{
                  stroke: "oklch(0.62 0.22 290 / 0.4)",
                  strokeWidth: 1,
                }}
              />
              <Area
                type="monotone"
                dataKey="completion"
                stroke="oklch(0.72 0.22 290)"
                strokeWidth={2.5}
                fill="url(#colorCompletion)"
                dot={{ fill: "oklch(0.72 0.22 290)", strokeWidth: 0, r: 3 }}
                activeDot={{
                  r: 5,
                  fill: "oklch(0.72 0.22 290)",
                  strokeWidth: 2,
                  stroke: "oklch(0.16 0.025 265)",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
