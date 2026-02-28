import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { motion } from "motion/react";
import type { Habit } from "../../backend.d";

interface WeeklySummaryProps {
  habits: Habit[];
  completions: Array<[Habit, Array<string>]>;
  onToggle?: (habitId: bigint, date: string) => void;
  today?: string;
}

export function WeeklySummary({
  habits,
  completions,
  onToggle,
  today: todayProp,
}: WeeklySummaryProps) {
  const todayDate = new Date();
  const todayStr = todayProp ?? format(todayDate, "yyyy-MM-dd");
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(todayDate, 6 - i);
    return {
      date: format(d, "yyyy-MM-dd"),
      label: format(d, "EEE"),
      dayNum: format(d, "d"),
      isToday: i === 6,
    };
  });

  const completionMap = new Map<string, Set<string>>();
  for (const [habit, dates] of completions) {
    completionMap.set(habit.id.toString(), new Set(dates));
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[420px]">
        {/* Day headers */}
        <div
          className="grid mb-3"
          style={{ gridTemplateColumns: "140px repeat(7, 1fr)" }}
        >
          <div /> {/* spacer */}
          {days.map((day) => (
            <div
              key={day.date}
              className={cn(
                "text-center flex flex-col items-center gap-0.5",
                day.isToday ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                {day.label}
              </span>
              <span
                className={cn(
                  "text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full",
                  day.isToday ? "bg-primary text-primary-foreground" : "",
                )}
              >
                {day.dayNum}
              </span>
            </div>
          ))}
        </div>

        {/* Habit rows */}
        <div className="space-y-2">
          {habits.map((habit, habitIdx) => {
            const completedDates =
              completionMap.get(habit.id.toString()) ?? new Set();
            const weekCompleted = days.filter((d) =>
              completedDates.has(d.date),
            ).length;
            const weekPct = Math.round((weekCompleted / 7) * 100);

            return (
              <motion.div
                key={habit.id.toString()}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: habitIdx * 0.06 }}
                className="grid items-center"
                style={{ gridTemplateColumns: "140px repeat(7, 1fr)" }}
              >
                {/* Habit name */}
                <div className="flex items-center gap-2 pr-3">
                  <span className="text-base">{habit.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {habit.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {weekPct}%
                    </p>
                  </div>
                </div>

                {/* Day cells */}
                {days.map((day) => {
                  const isCompleted = completedDates.has(day.date);
                  const isFuture = day.date > todayStr;
                  const isInteractive = !isFuture && !!onToggle;

                  return (
                    <div
                      key={day.date}
                      className="flex items-center justify-center py-1"
                    >
                      <motion.button
                        type="button"
                        whileHover={isInteractive ? { scale: 1.15 } : {}}
                        whileTap={isInteractive ? { scale: 0.88 } : {}}
                        onClick={
                          isInteractive
                            ? () => onToggle(habit.id, day.date)
                            : undefined
                        }
                        disabled={isFuture}
                        aria-label={`${isCompleted ? "Unmark" : "Mark"} ${habit.name} on ${day.date}`}
                        aria-pressed={isCompleted}
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200",
                          isCompleted
                            ? "shadow-sm"
                            : "bg-muted/40 border border-border/30",
                          isInteractive &&
                            !isCompleted &&
                            "hover:bg-muted/70 hover:border-border/60",
                          isInteractive &&
                            "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                          isFuture && "opacity-30 cursor-not-allowed",
                          !isInteractive && !isFuture && "cursor-default",
                        )}
                        style={
                          isCompleted
                            ? {
                                backgroundColor: `${habit.color}30`,
                                border: `1px solid ${habit.color}60`,
                                color: habit.color,
                              }
                            : {}
                        }
                        title={
                          isFuture
                            ? `${habit.name} - future date`
                            : `${isCompleted ? "Unmark" : "Mark"} ${habit.name} on ${day.date}`
                        }
                      >
                        {isCompleted ? "✓" : ""}
                      </motion.button>
                    </div>
                  );
                })}
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/30 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-4 h-4 rounded bg-muted/40 border border-border/30" />
            <span>Not completed</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-4 h-4 rounded bg-primary/30 border border-primary/60 flex items-center justify-center text-primary text-[10px] font-bold">
              ✓
            </div>
            <span>Completed</span>
          </div>
          {onToggle && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground opacity-60">
              <div className="w-4 h-4 rounded bg-muted/20 border border-border/20 opacity-30" />
              <span>Future (locked)</span>
            </div>
          )}
          {onToggle && (
            <span className="text-xs text-muted-foreground ml-auto italic">
              Click any past/today cell to toggle
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
