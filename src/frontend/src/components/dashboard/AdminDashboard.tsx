import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Lock,
  Phone,
  RefreshCw,
  Search,
  Shield,
  Target,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserAdminDetail } from "../../backend.d";
import {
  useGetAdminUserDetails,
  useGetWeeklyChallenge,
  useIsAdmin,
  useRemoveUser,
  useSetWeeklyChallenge,
} from "../../hooks/useQueries";

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

function formatDate(ns: bigint): string {
  if (!ns) return "N/A";
  try {
    const ms = Number(ns / 1_000_000n);
    return new Date(ms).toLocaleDateString();
  } catch {
    return "N/A";
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

// ─── CSV Export ────────────────────────────────────────────────────────────

function exportUsersCSV(users: UserAdminDetail[]) {
  const headers = [
    "Name",
    "Principal ID",
    "Mobile",
    "First Login",
    "Last Login",
    "Habit Count",
    "Habits",
    "Completions Today",
    "Weekly Rate (%)",
  ];
  const rows = users.map((u) => [
    u.displayName || "Anonymous",
    u.principal,
    u.mobile || "",
    formatDate(u.firstLogin),
    formatDate(u.lastLogin),
    u.habits.length.toString(),
    u.habits.map((h) => `${h.emoji} ${h.name}`).join("; "),
    u.completionsToday.toString(),
    u.weeklyCompletionRate.toString(),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `habitflow-users-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── User Card ─────────────────────────────────────────────────────────────

function UserCard({
  user,
  index,
  onRemove,
  isRemoving,
}: {
  user: UserAdminDetail;
  index: number;
  onRemove: (principal: string) => void;
  isRemoving: boolean;
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

        {/* Name + principal + mobile */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
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
          {user.mobile && (
            <div className="flex items-center gap-1 mt-0.5">
              <Phone size={10} className="text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">
                {user.mobile}
              </span>
            </div>
          )}
        </div>

        {/* Remove user button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title={`Remove ${displayName ?? "user"}`}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove{" "}
                <strong>{displayName ?? "this user"}</strong>? This will delete
                all their data including habits, completions, and profile. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onRemove(user.principal)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

// ─── Weekly Challenge Form ──────────────────────────────────────────────────

function WeeklyChallengeForm() {
  const { data: existing } = useGetWeeklyChallenge();
  const setChallengeMutation = useSetWeeklyChallenge();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [targetPerDay, setTargetPerDay] = useState(
    existing ? Number(existing.targetCompletionsPerDay).toString() : "3",
  );
  const [deadline, setDeadline] = useState(existing?.deadline ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setChallengeMutation.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        targetCompletionsPerDay: BigInt(targetPerDay || "1"),
        deadline,
      },
      {
        onSuccess: () => toast.success("Weekly challenge set!"),
        onError: () => toast.error("Failed to set challenge."),
      },
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="card-surface rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} className="text-primary" />
        <h3 className="text-sm font-bold text-foreground">
          Set Weekly Challenge
        </h3>
        {existing && (
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/25">
            Active
          </span>
        )}
      </div>
      {existing && (
        <div className="mb-4 p-3 rounded-xl bg-muted/20 border border-border/40">
          <p className="text-xs font-semibold text-foreground">
            Current: {existing.title}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {existing.description}
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Title *
          </Label>
          <Input
            placeholder="e.g. 7-Day Consistency Sprint"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 60))}
            className="bg-background/50 border-border/60 text-sm"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Description
          </Label>
          <Textarea
            placeholder="Describe the challenge..."
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 120))}
            className="bg-background/50 border-border/60 text-sm resize-none min-h-[60px]"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Target size={11} />
              Habits/day goal
            </Label>
            <Input
              type="number"
              min={1}
              value={targetPerDay}
              onChange={(e) => setTargetPerDay(e.target.value)}
              className="bg-background/50 border-border/60 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Deadline
            </Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-background/50 border-border/60 text-sm"
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={!title.trim() || setChallengeMutation.isPending}
          size="sm"
          className="w-full"
        >
          {setChallengeMutation.isPending ? (
            <Loader2 size={13} className="mr-1.5 animate-spin" />
          ) : (
            <Zap size={13} className="mr-1.5" />
          )}
          {existing ? "Update Challenge" : "Set Challenge"}
        </Button>
      </form>
    </motion.div>
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
  const isAdmin =
    isAdminProp === true
      ? true
      : isAdminProp !== undefined
        ? isAdminProp
        : isAdminFromQuery;

  const {
    data: users = [],
    isLoading: usersLoading,
    refetch,
    isFetching,
  } = useGetAdminUserDetails(isAdmin === true);

  const removeUserMutation = useRemoveUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [removingPrincipal, setRemovingPrincipal] = useState<string | null>(
    null,
  );

  const handleRemoveUser = (principal: string) => {
    setRemovingPrincipal(principal);
    removeUserMutation.mutate(
      { principal },
      {
        onSuccess: () => {
          toast.success("User removed successfully");
          setRemovingPrincipal(null);
        },
        onError: () => {
          toast.error("Failed to remove user. Please try again.");
          setRemovingPrincipal(null);
        },
      },
    );
  };

  const filteredUsers = searchQuery.trim()
    ? users.filter(
        (u) =>
          u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.principal.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.mobile.includes(searchQuery),
      )
    : users;

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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              User Dashboard
            </h2>
            <p className="text-sm text-muted-foreground">
              Monitor all platform users and their habits at a glance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportUsersCSV(users)}
              disabled={users.length === 0}
              className="flex items-center gap-2 border-border/50 hover:border-primary/40"
            >
              <Download size={14} />
              Export CSV
            </Button>
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

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="relative"
      >
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search by name, principal ID, or mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-background/50 border-border/60"
        />
        {searchQuery && (
          <Badge
            variant="secondary"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
          >
            {filteredUsers.length} result{filteredUsers.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </motion.div>

      {/* Weekly Challenge form */}
      <WeeklyChallengeForm />

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
        ) : filteredUsers.length === 0 ? (
          <div className="card-surface rounded-2xl flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center mb-3">
              <Users size={22} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {searchQuery ? "No matching users" : "No users yet"}
            </p>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? "Try a different search term"
                : "Users will appear here once they log in."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user, idx) => (
              <UserCard
                key={user.principal}
                user={user}
                index={idx}
                onRemove={handleRemoveUser}
                isRemoving={removingPrincipal === user.principal}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
