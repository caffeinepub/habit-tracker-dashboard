import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Medal,
  Trophy,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { LeaderboardEntry } from "../../backend.d";
import {
  useFollowUser,
  useGetFollowing,
  useGetFriendLeaderboard,
  useGetLeaderboard,
  useUnfollowUser,
} from "../../hooks/useQueries";

function getLevel(points: bigint): {
  label: string;
  color: string;
  bg: string;
} {
  const pts = Number(points);
  if (pts >= 5000)
    return { label: "Master", color: "#f59e0b", bg: "#f59e0b20" };
  if (pts >= 2000)
    return { label: "Expert", color: "#8b5cf6", bg: "#8b5cf620" };
  if (pts >= 500)
    return { label: "Intermediate", color: "#3b82f6", bg: "#3b82f620" };
  return { label: "Beginner", color: "#6b7280", bg: "#6b728020" };
}

function getRankBadge(rank: number) {
  if (rank === 1) return { icon: "🥇", color: "#f59e0b" };
  if (rank === 2) return { icon: "🥈", color: "#9ca3af" };
  if (rank === 3) return { icon: "🥉", color: "#92400e" };
  return null;
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
  index: number;
}

function LeaderboardRow({
  entry,
  rank,
  isCurrentUser,
  index,
}: LeaderboardRowProps) {
  const level = getLevel(entry.points);
  const badge = getRankBadge(rank);
  const initials = entry.displayName
    ? entry.displayName.slice(0, 2).toUpperCase()
    : "??";

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
        isCurrentUser
          ? "border-primary/40 bg-primary/5"
          : "border-border/40 bg-card/30 hover:border-border/60",
      )}
    >
      {/* Rank */}
      <div className="w-8 text-center shrink-0">
        {badge ? (
          <span className="text-xl leading-none">{badge.icon}</span>
        ) : (
          <span className="text-sm font-bold text-muted-foreground">
            #{rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.62 0.22 290), oklch(0.68 0.18 330))",
        }}
      >
        {initials}
      </div>

      {/* Name + level */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-sm font-semibold truncate",
              isCurrentUser ? "text-primary" : "text-foreground",
            )}
          >
            {entry.displayName || "Anonymous"}
          </span>
          {isCurrentUser && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 shrink-0">
              You
            </span>
          )}
        </div>
        <span
          className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5"
          style={{ backgroundColor: level.bg, color: level.color }}
        >
          {level.label}
        </span>
      </div>

      {/* Points */}
      <div className="text-right shrink-0">
        <div className="flex items-center gap-1 justify-end">
          <Trophy size={12} className="text-amber-500" />
          <span className="text-sm font-bold text-foreground tabular-nums">
            {Number(entry.points).toLocaleString()}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">points</p>
      </div>
    </motion.div>
  );
}

// ─── Friends Tab ─────────────────────────────────────────────────────────────

interface FriendsTabProps {
  currentUserPrincipal?: string;
}

function FriendsTab({ currentUserPrincipal }: FriendsTabProps) {
  const { data: friendEntries = [], isLoading: loadingFriends } =
    useGetFriendLeaderboard();
  const { data: following = [], isLoading: loadingFollowing } =
    useGetFollowing();
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const [addInput, setAddInput] = useState("");

  const handleFollow = () => {
    const trimmed = addInput.trim();
    if (!trimmed) return;
    followMutation.mutate(
      { principalStr: trimmed },
      {
        onSuccess: () => {
          toast.success("User followed!");
          setAddInput("");
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to follow user",
          );
        },
      },
    );
  };

  const handleUnfollow = (principalStr: string) => {
    unfollowMutation.mutate(
      { principalStr },
      {
        onSuccess: () => toast.success("Unfollowed"),
        onError: () => toast.error("Failed to unfollow"),
      },
    );
  };

  return (
    <div className="space-y-4">
      {/* Add Friend */}
      <div className="p-4 rounded-2xl border border-border/40 bg-card/30 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <UserPlus size={15} className="text-primary" />
          Add a Friend
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="Paste their Principal ID..."
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            className="bg-background/50 border-border/60 text-xs font-mono flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleFollow();
            }}
          />
          <Button
            size="sm"
            onClick={handleFollow}
            disabled={!addInput.trim() || followMutation.isPending}
          >
            {followMutation.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              "Follow"
            )}
          </Button>
        </div>
      </div>

      {/* Following list */}
      {!loadingFollowing && following.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Following ({following.length})
          </h3>
          {following.map((p) => (
            <div
              key={p}
              className="flex items-center gap-3 px-3 py-2 rounded-xl border border-border/40 bg-card/30"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.62 0.22 290), oklch(0.68 0.18 330))",
                }}
              >
                {p.slice(0, 2).toUpperCase()}
              </div>
              <code className="text-[10px] text-muted-foreground font-mono flex-1 truncate">
                {p.length > 20 ? `${p.slice(0, 10)}...${p.slice(-6)}` : p}
              </code>
              <button
                type="button"
                onClick={() => handleUnfollow(p)}
                disabled={unfollowMutation.isPending}
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Unfollow"
              >
                <UserMinus size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Friend leaderboard */}
      {loadingFriends ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
              key={i}
              className="h-16 rounded-xl bg-muted/20 animate-pulse"
            />
          ))}
        </div>
      ) : friendEntries.length === 0 ? (
        <div className="card-surface rounded-2xl flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="text-3xl mb-3">👥</div>
          <p className="text-sm font-semibold text-foreground mb-1">
            No friends yet
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Add friends by their Principal ID to see a private leaderboard.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Friends Leaderboard
          </h3>
          {friendEntries.map((entry, i) => (
            <LeaderboardRow
              key={entry.principal}
              entry={entry}
              rank={i + 1}
              isCurrentUser={entry.principal === currentUserPrincipal}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LeaderboardPage ──────────────────────────────────────────────────────────

interface LeaderboardPageProps {
  currentUserPrincipal?: string;
}

export function LeaderboardPage({
  currentUserPrincipal,
}: LeaderboardPageProps) {
  const { data: entries = [], isLoading } = useGetLeaderboard();

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
            Community
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Leaderboard</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Top habit builders ranked by points
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl card-surface">
            <Medal size={16} className="text-amber-500" />
            <span className="text-xs font-semibold text-muted-foreground">
              {entries.length} users
            </span>
          </div>
        </div>
      </motion.div>

      {/* Tabs: Global / Friends */}
      <Tabs defaultValue="global" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger
            value="global"
            className="flex-1 flex items-center gap-1.5"
          >
            <Trophy size={13} />
            Global
          </TabsTrigger>
          <TabsTrigger
            value="friends"
            className="flex-1 flex items-center gap-1.5"
          >
            <Users size={13} />
            Friends
          </TabsTrigger>
        </TabsList>

        {/* Global Tab */}
        <TabsContent value="global" className="mt-4 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                  key={i}
                  className="h-16 rounded-xl bg-muted/20 animate-pulse"
                />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="card-surface rounded-2xl flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="text-4xl mb-4">🏆</div>
              <p className="text-sm font-semibold text-foreground mb-1">
                No rankings yet
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Complete habits to earn points and appear on the leaderboard!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, i) => (
                <LeaderboardRow
                  key={entry.principal}
                  entry={entry}
                  rank={i + 1}
                  isCurrentUser={entry.principal === currentUserPrincipal}
                  index={i}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Friends Tab */}
        <TabsContent value="friends" className="mt-4">
          <FriendsTab currentUserPrincipal={currentUserPrincipal} />
        </TabsContent>
      </Tabs>

      {/* Points info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="card-surface rounded-2xl p-5"
      >
        <h3 className="text-sm font-bold text-foreground mb-3">
          How to earn points
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { emoji: "✅", label: "Easy habit", pts: "+10 pts" },
            { emoji: "💪", label: "Medium habit", pts: "+20 pts" },
            { emoji: "🔥", label: "Hard habit", pts: "+30 pts" },
            {
              emoji: "🎯",
              label: "Complete all habits",
              pts: "+50 pts bonus",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/40"
            >
              <span className="text-xl">{item.emoji}</span>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {item.pts}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Level guide */}
        <h3 className="text-sm font-bold text-foreground mt-4 mb-3">
          Level guide
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Beginner", range: "0–499 pts", color: "#6b7280" },
            { label: "Intermediate", range: "500–1999 pts", color: "#3b82f6" },
            { label: "Expert", range: "2000–4999 pts", color: "#8b5cf6" },
            { label: "Master", range: "5000+ pts", color: "#f59e0b" },
          ].map((lvl) => (
            <div
              key={lvl.label}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border"
              style={{
                backgroundColor: `${lvl.color}15`,
                borderColor: `${lvl.color}30`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: lvl.color }}
              />
              <div>
                <p
                  className="text-[11px] font-bold"
                  style={{ color: lvl.color }}
                >
                  {lvl.label}
                </p>
                <p className="text-[9px] text-muted-foreground">{lvl.range}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
