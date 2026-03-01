import {
  BarChart2,
  Flame,
  ListChecks,
  Snowflake,
  Star,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface StatsData {
  totalHabits: number;
  todayCompletion: number;
  bestStreak: number;
  weeklyAverage: number;
  streakTokens?: number;
  points?: number;
}

interface StatCardProps {
  title: string;
  value: number;
  unit?: string;
  icon: React.ReactNode;
  gradient: string;
  delay: number;
  description: string;
}

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.round(target * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return count;
}

function StatCard({
  title,
  value,
  unit,
  icon,
  gradient,
  delay,
  description,
}: StatCardProps) {
  const displayValue = useCountUp(value, 1000 + delay * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1, ease: "easeOut" }}
      className="card-surface card-hover rounded-2xl p-5 relative overflow-hidden"
    >
      {/* Background accent */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10"
        style={{ background: gradient }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${gradient}33` }}
          >
            <span style={{ color: "white" }}>{icon}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold text-foreground tabular-nums">
              {displayValue}
            </span>
            {unit && (
              <span className="text-lg font-semibold text-muted-foreground mb-0.5">
                {unit}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

interface StatsCardsProps {
  stats: StatsData;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const baseCards = [
    {
      title: "Total Habits",
      value: stats.totalHabits,
      icon: <ListChecks size={18} />,
      gradient:
        "linear-gradient(135deg, oklch(0.62 0.22 290), oklch(0.55 0.2 310))",
      description: "Active tracking",
    },
    {
      title: "Today's Progress",
      value: stats.todayCompletion,
      unit: "%",
      icon: <TrendingUp size={18} />,
      gradient:
        "linear-gradient(135deg, oklch(0.7 0.19 155), oklch(0.6 0.18 165))",
      description: "Completion rate",
    },
    {
      title: "Best Streak",
      value: stats.bestStreak,
      unit: "days",
      icon: <Flame size={18} />,
      gradient:
        "linear-gradient(135deg, oklch(0.72 0.18 50), oklch(0.68 0.2 35))",
      description: "Your record",
    },
    {
      title: "Weekly Average",
      value: stats.weeklyAverage,
      unit: "%",
      icon: <BarChart2 size={18} />,
      gradient:
        "linear-gradient(135deg, oklch(0.65 0.2 200), oklch(0.58 0.18 220))",
      description: "Last 7 days",
    },
  ];

  const extraCards = [
    ...(stats.points !== undefined
      ? [
          {
            title: "Total Points",
            value: stats.points,
            icon: <Star size={18} />,
            gradient:
              "linear-gradient(135deg, oklch(0.78 0.18 75), oklch(0.72 0.2 55))",
            description: "Earn 10 per habit",
          },
        ]
      : []),
    ...(stats.streakTokens !== undefined
      ? [
          {
            title: "Streak Tokens",
            value: stats.streakTokens,
            icon: <Snowflake size={18} />,
            gradient:
              "linear-gradient(135deg, oklch(0.72 0.14 210), oklch(0.65 0.16 195))",
            description: "Freeze a missed day",
          },
        ]
      : []),
  ];

  const allCards = [...baseCards, ...extraCards];

  return (
    <div
      className={`grid gap-4 ${allCards.length <= 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-3"}`}
    >
      {allCards.map((card, i) => (
        <StatCard key={card.title} {...card} delay={i} />
      ))}
    </div>
  );
}
