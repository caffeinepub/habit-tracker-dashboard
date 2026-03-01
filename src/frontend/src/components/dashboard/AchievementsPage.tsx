import { cn } from "@/lib/utils";
import { Lock, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useGetAchievements } from "../../hooks/useQueries";

const ACHIEVEMENT_META: Record<
  string,
  { emoji: string; gradient: string; glow: string }
> = {
  first_habit: {
    emoji: "🌱",
    gradient: "from-emerald-500/30 to-teal-500/20",
    glow: "#22c55e",
  },
  habit_collector: {
    emoji: "📦",
    gradient: "from-blue-500/30 to-cyan-500/20",
    glow: "#3b82f6",
  },
  centurion: {
    emoji: "💯",
    gradient: "from-orange-500/30 to-amber-500/20",
    glow: "#f97316",
  },
  perfect_week: {
    emoji: "🔥",
    gradient: "from-red-500/30 to-orange-500/20",
    glow: "#ef4444",
  },
  seven_day_warrior: {
    emoji: "⚔️",
    gradient: "from-purple-500/30 to-violet-500/20",
    glow: "#8b5cf6",
  },
  consistency_king: {
    emoji: "👑",
    gradient: "from-yellow-500/30 to-amber-400/20",
    glow: "#eab308",
  },
};

function AchievementCard({
  id,
  name,
  description,
  earned,
  earnedAt,
  index,
}: {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  earnedAt: bigint;
  index: number;
}) {
  const meta = ACHIEVEMENT_META[id] ?? {
    emoji: "🏆",
    gradient: "from-muted/30 to-muted/20",
    glow: "#6b7280",
  };

  const earnedDate =
    earned && earnedAt > 0n
      ? new Date(Number(earnedAt / 1_000_000n)).toLocaleDateString()
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      className={cn(
        "relative rounded-2xl border overflow-hidden flex flex-col items-center text-center p-6 transition-all duration-300",
        earned
          ? "card-surface border-border/50 hover:border-border"
          : "bg-muted/10 border-border/20 opacity-60",
      )}
      style={
        earned
          ? {
              boxShadow: `0 0 20px ${meta.glow}20, 0 0 40px ${meta.glow}08`,
            }
          : undefined
      }
    >
      {/* Background gradient */}
      {earned && (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none",
            meta.gradient,
          )}
        />
      )}

      {/* Lock overlay for unearned */}
      {!earned && (
        <div className="absolute top-3 right-3">
          <Lock size={14} className="text-muted-foreground/60" />
        </div>
      )}

      {/* Emoji badge */}
      <div
        className={cn(
          "relative w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-3 transition-all duration-300",
          earned ? "bg-gradient-to-br shadow-lg" : "bg-muted/30",
        )}
        style={
          earned
            ? {
                background: `linear-gradient(135deg, ${meta.glow}30, ${meta.glow}10)`,
                border: `1px solid ${meta.glow}40`,
                boxShadow: `0 4px 16px ${meta.glow}30`,
              }
            : undefined
        }
      >
        <span
          className={cn(
            "transition-all duration-300",
            !earned && "grayscale opacity-50",
          )}
        >
          {meta.emoji}
        </span>
      </div>

      {/* Name */}
      <h3
        className={cn(
          "font-bold text-sm mb-1 leading-tight",
          earned ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {name}
      </h3>

      {/* Description */}
      <p
        className={cn(
          "text-xs leading-relaxed",
          earned ? "text-muted-foreground" : "text-muted-foreground/60",
        )}
      >
        {description}
      </p>

      {/* Earned date */}
      {earnedDate && (
        <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success/10 border border-success/25 text-[10px] font-semibold text-success">
          ✓ Earned {earnedDate}
        </div>
      )}

      {!earned && (
        <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted/30 border border-border/20 text-[10px] font-medium text-muted-foreground/60">
          Not yet earned
        </div>
      )}
    </motion.div>
  );
}

export function AchievementsPage() {
  const { data: achievements = [], isLoading } = useGetAchievements();

  const earnedCount = achievements.filter((a) => a.earned).length;
  const totalCount = achievements.length;

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
            Achievements
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Your Badges</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Milestones you've hit on your habit journey
            </p>
          </div>
          {totalCount > 0 && (
            <div className="shrink-0 flex flex-col items-end">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl card-surface">
                <Trophy size={16} className="text-yellow-500" />
                <span className="text-sm font-bold text-foreground">
                  {earnedCount}
                  <span className="text-muted-foreground font-normal">
                    /{totalCount}
                  </span>
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-right">
                unlocked
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full h-2 rounded-full bg-muted/30 overflow-hidden"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${(earnedCount / totalCount) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          />
        </motion.div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
              key={i}
              className="rounded-2xl bg-muted/20 animate-pulse h-44"
            />
          ))}
        </div>
      ) : achievements.length === 0 ? (
        <div className="card-surface rounded-2xl flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mb-4 text-3xl">
            🏆
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            No achievements yet
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Start logging habits to unlock your first badge!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Show earned first, then locked */}
          {[
            ...achievements.filter((a) => a.earned),
            ...achievements.filter((a) => !a.earned),
          ].map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              id={achievement.id}
              name={achievement.name}
              description={achievement.description}
              earned={achievement.earned}
              earnedAt={achievement.earnedAt}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
