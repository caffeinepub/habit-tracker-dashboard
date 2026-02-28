import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import type { UserAdminDetail } from "../../backend.d";
import { useGetAdminUserDetails, useIsAdmin } from "../../hooks/useQueries";

// ─── Helpers ───────────────────────────────────────────────────────────────

function timeAgo(ns: bigint): string {
  if (!ns) return "Never";
  try {
    const ms = Number(ns / 1_000_000n);
    const diff = Date.now() - ms;
    if (diff < 0) return "Just now";
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  } catch {
    return "—";
  }
}

function isRecentlyActive(ns: bigint): boolean {
  if (!ns) return false;
  try {
    const ms = Number(ns / 1_000_000n);
    return Date.now() - ms < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function truncatePrincipal(p: string): string {
  if (p.length <= 14) return p;
  return `${p.slice(0, 8)}...${p.slice(-4)}`;
}

function getInitials(name: string, principal: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.trim()[0].toUpperCase();
  }
  return principal[0].toUpperCase();
}

// Deterministic color from string for avatar
function principalToHue(principal: string): number {
  let hash = 0;
  for (let i = 0; i < principal.length; i++) {
    hash = (hash * 31 + principal.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % 360;
}

// ─── User Card ─────────────────────────────────────────────────────────────

function UserCard({
  user,
  index,
}: {
  user: UserAdminDetail;
  index: number;
}) {
  const active = isRecentlyActive(user.lastLogin);
  const displayName = user.displayName?.trim() ? user.displayName : null;
  const initials = getInitials(user.displayName, user.principal);
  const hue = principalToHue(user.principal);
  const weeklyRate = Number(user.weeklyCompletionRate);
  const completionsToday = Number(user.completionsToday);
  const habitCount = user.habits.length;
  const visibleHabits = user.habits.slice(0, 6);
  const extraHabits = habitCount > 6 ? habitCount - 6 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="card-surface rounded-2xl overflow-hidden flex flex-col"
    >
      {/* Card header */}
      <div className="p-5 pb-4 flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-lg shadow-sm"
          style={{
            background: `oklch(0.6 0.18 ${hue})`,
          }}
        >
          {initials}
        </div>

        {/* Name + principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-foreground truncate text-sm">
              {displayName ?? "Anonymous User"}
            </p>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                active
                  ? "bg-success/15 text-success"
                  : "bg-muted/40 text-muted-foreground"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${active ? "bg-success" : "bg-muted-foreground/50"}`}
              />
              {active ? "Active" : "Inactive"}
            </span>
          </div>
          <code className="text-[11px] text-muted-foreground font-mono">
            {truncatePrincipal(user.principal)}
          </code>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-5 pb-4 grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center bg-muted/20 rounded-lg py-2.5 px-1">
          <Clock size={13} className="text-muted-foreground mb-1" />
          <span className="text-[10px] text-muted-foreground leading-none mb-0.5">
            Last seen
          </span>
          <span className="text-xs font-semibold text-foreground text-center leading-tight">
            {timeAgo(user.lastLogin)}
          </span>
        </div>
        <div className="flex flex-col items-center bg-muted/20 rounded-lg py-2.5 px-1">
          <BookOpen size={13} className="text-muted-foreground mb-1" />
          <span className="text-[10px] text-muted-foreground leading-none mb-0.5">
            Habits
          </span>
          <span className="text-xs font-semibold text-foreground">
            {habitCount}
          </span>
        </div>
        <div className="flex flex-col items-center bg-muted/20 rounded-lg py-2.5 px-1">
          <CheckCircle2 size={13} className="text-muted-foreground mb-1" />
          <span className="text-[10px] text-muted-foreground leading-none mb-0.5">
            Today
          </span>
          <span className="text-xs font-semibold text-foreground">
            {completionsToday} done
          </span>
        </div>
      </div>

      {/* Weekly progress */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-muted-foreground font-medium">
            Weekly rate
          </span>
          <span
            className={`text-[11px] font-bold ${
              weeklyRate >= 70
                ? "text-success"
                : weeklyRate >= 40
                  ? "text-chart-4"
                  : "text-muted-foreground"
            }`}
          >
            {weeklyRate}%
          </span>
        </div>
        <Progress value={weeklyRate} className="h-1.5" />
      </div>

      {/* Habit chips */}
      <div className="px-5 pb-5 mt-auto">
        {habitCount === 0 ? (
          <p className="text-xs text-muted-foreground italic">No habits yet</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {visibleHabits.map((habit) => {
              // Build a tint from the habit's color (hex → hue extraction fallback)
              const bg = habit.color
                ? `${habit.color}22`
                : "hsl(var(--muted)/0.3)";
              const border = habit.color
                ? `${habit.color}55`
                : "hsl(var(--border))";
              return (
                <span
                  key={String(habit.id)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: bg,
                    borderColor: border,
                    color: "hsl(var(--foreground))",
                  }}
                >
                  <span>{habit.emoji}</span>
                  <span className="max-w-[80px] truncate">{habit.name}</span>
                </span>
              );
            })}
            {extraHabits > 0 && (
              <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border border-border/40 bg-muted/20 text-muted-foreground">
                +{extraHabits} more
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="card-surface rounded-xl p-4 flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${accent}/10 shrink-0`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold text-foreground leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── AdminDashboard ─────────────────────────────────────────────────────────

interface AdminDashboardProps {
  isAdmin?: boolean;
}

export function AdminDashboard({
  isAdmin: isAdminProp,
}: AdminDashboardProps = {}) {
  const { data: isAdminFromQuery, isLoading: adminLoading } = useIsAdmin();
  const isAdmin = isAdminProp !== undefined ? isAdminProp : isAdminFromQuery;

  const {
    data: users = [],
    isLoading: usersLoading,
    refetch,
    isFetching,
  } = useGetAdminUserDetails();

  if (adminLoading && isAdminProp === undefined) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-destructive/15 flex items-center justify-center mb-4">
          <Lock size={28} className="text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Access Denied
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          You don't have administrator privileges. This section is restricted to
          admins only.
        </p>
      </motion.div>
    );
  }

  const activeCount = users.filter((u) => isRecentlyActive(u.lastLogin)).length;
  const totalHabits = users.reduce((sum, u) => sum + u.habits.length, 0);

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
            Admin
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              User Dashboard
            </h2>
            <p className="text-sm text-muted-foreground">
              Monitor all platform users and their habits at a glance
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 border-border/50 hover:border-primary/40"
          >
            {isFetching ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Summary stat cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <StatCard
          icon={<Users size={20} className="text-primary" />}
          label="Total Users"
          value={users.length.toString()}
          accent="primary"
        />
        <StatCard
          icon={<Activity size={20} className="text-success" />}
          label="Active (7 days)"
          value={activeCount.toString()}
          accent="success"
        />
        <StatCard
          icon={<Shield size={20} className="text-chart-4" />}
          label="Total Habits"
          value={totalHabits.toString()}
          accent="chart-4"
        />
      </motion.div>

      {/* User cards grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {usersLoading ? (
          <div className="card-surface rounded-2xl flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="card-surface rounded-2xl flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center mb-3">
              <Users size={22} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              No users yet
            </p>
            <p className="text-xs text-muted-foreground">
              Users will appear here once they log in.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user, idx) => (
              <UserCard key={user.principal} user={user} index={idx} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
