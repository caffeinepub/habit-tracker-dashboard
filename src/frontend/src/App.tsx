import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { Calendar, Menu, Plus, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AddHabitModal } from "./components/dashboard/AddHabitModal";
import { AdminDashboard } from "./components/dashboard/AdminDashboard";
import { AdminDirectView } from "./components/dashboard/AdminDirectView";
import { HabitList } from "./components/dashboard/HabitList";
import { LoginScreen } from "./components/dashboard/LoginScreen";
import { ProfileSetupModal } from "./components/dashboard/ProfileSetupModal";
import { ProgressCharts } from "./components/dashboard/ProgressCharts";
import { Sidebar } from "./components/dashboard/Sidebar";
import { StatsCards } from "./components/dashboard/StatsCards";
import { WeeklySummary } from "./components/dashboard/WeeklySummary";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useAddHabit,
  useDeleteHabit,
  useGetAllHabits,
  useGetCallerUserProfile,
  useGetCompletions,
  useGetStreakData,
  useInitHabits,
  useIsAdmin,
  useRecordLogin,
  useSaveCallerUserProfile,
  useToggleCompletion,
} from "./hooks/useQueries";

const today = format(new Date(), "yyyy-MM-dd");
const pastDate = format(subDays(new Date(), 27), "yyyy-MM-dd");
const todayDisplay = format(new Date(), "EEEE, MMMM d");

const HARDCODED_ADMIN_PRINCIPAL =
  "h3k33-vzkys-gtpvb-j7eqr-rvkzy-mzzsd-ll3yr-u36x5-hfopd-jkaib-hae";

// Detect admin direct access from URL hash (evaluated once at module load)
const adminDirectPrincipal = (() => {
  const hash = window.location.hash;
  const match = hash.match(/adminDirect=([^&]+)/);
  return match ? match[1] : null;
})();

const isAdminDirectAccess = adminDirectPrincipal === HARDCODED_ADMIN_PRINCIPAL;

export default function App() {
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [hasRecordedLogin, setHasRecordedLogin] = useState(false);
  const [tokenUnlockedAdmin, setTokenUnlockedAdmin] = useState(false);

  const handleAdminTokenSubmit = useCallback((_token: string) => {
    setTokenUnlockedAdmin(true);
    setActiveSection("admin");
  }, []);

  const recordLoginMutation = useRecordLogin();
  const { data: isAdmin } = useIsAdmin();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();
  const saveProfileMutation = useSaveCallerUserProfile();

  // Record login once after authentication + actor ready
  const recordLoginMutateFn = recordLoginMutation.mutate;
  useEffect(() => {
    if (isAuthenticated && !hasRecordedLogin && !profileLoading) {
      setHasRecordedLogin(true);
      recordLoginMutateFn();
    }
  }, [isAuthenticated, hasRecordedLogin, profileLoading, recordLoginMutateFn]);

  const handleLogout = useCallback(() => {
    clear();
    queryClient.clear();
    setHasRecordedLogin(false);
    setActiveSection("dashboard");
  }, [clear, queryClient]);

  const handleSaveProfile = useCallback(
    (name: string) => {
      saveProfileMutation.mutate(
        { name },
        {
          onSuccess: () => toast.success("Profile saved!"),
          onError: () => toast.error("Failed to save profile."),
        },
      );
    },
    [saveProfileMutation],
  );

  // Admin direct access via URL hash — show admin panel without normal app flow
  if (isAdminDirectAccess) {
    return (
      <>
        <AdminDirectView
          isAuthenticated={isAuthenticated}
          onLogin={login}
          isLoggingIn={isLoggingIn || isInitializing}
        />
        <Toaster position="bottom-right" theme="dark" />
      </>
    );
  }

  // Show login screen if not authenticated (and not initializing)
  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen
          onLogin={login}
          isLoggingIn={isLoggingIn || isInitializing}
        />
        <Toaster position="bottom-right" theme="dark" />
      </>
    );
  }

  const userPrincipal = identity?.getPrincipal().toString();

  // Show profile setup modal — only after profile fetch resolves to null
  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  return (
    <AuthenticatedApp
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
      isAddModalOpen={isAddModalOpen}
      setIsAddModalOpen={setIsAddModalOpen}
      isAdmin={!!isAdmin || tokenUnlockedAdmin}
      userName={userProfile?.name}
      userPrincipal={userPrincipal}
      onLogout={handleLogout}
      showProfileSetup={showProfileSetup}
      onSaveProfile={handleSaveProfile}
      isSavingProfile={saveProfileMutation.isPending}
      onAdminTokenSubmit={handleAdminTokenSubmit}
    />
  );
}

interface AuthenticatedAppProps {
  activeSection: string;
  setActiveSection: (s: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (v: boolean) => void;
  isAdmin: boolean;
  userName?: string;
  userPrincipal?: string;
  onLogout: () => void;
  showProfileSetup: boolean;
  onSaveProfile: (name: string) => void;
  isSavingProfile: boolean;
  onAdminTokenSubmit: (token: string) => void;
}

function AuthenticatedApp({
  activeSection,
  setActiveSection,
  isSidebarOpen,
  setIsSidebarOpen,
  isAddModalOpen,
  setIsAddModalOpen,
  isAdmin,
  userName,
  userPrincipal,
  onLogout,
  showProfileSetup,
  onSaveProfile,
  isSavingProfile,
  onAdminTokenSubmit,
}: AuthenticatedAppProps) {
  // Init habits on load
  useInitHabits();

  const { data: habits = [] } = useGetAllHabits();
  const { data: streaks = [] } = useGetStreakData();
  const { data: completions = [] } = useGetCompletions(pastDate, today);
  const toggleMutation = useToggleCompletion();
  const addHabitMutation = useAddHabit();
  const deleteHabitMutation = useDeleteHabit();

  // Compute completed today
  const completedToday = useMemo(() => {
    const set = new Set<string>();
    for (const [habit, dates] of completions) {
      if (dates.includes(today)) {
        set.add(habit.id.toString());
      }
    }
    return set;
  }, [completions]);

  // Compute weekly completions (last 7 days)
  const weeklyCompletedCounts = useMemo(() => {
    let totalSlots = 0;
    let totalCompleted = 0;
    for (const [, dates] of completions) {
      const dateSet = new Set(dates);
      for (let i = 0; i < 7; i++) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        totalSlots++;
        if (dateSet.has(d)) totalCompleted++;
      }
    }
    return totalSlots > 0 ? Math.round((totalCompleted / totalSlots) * 100) : 0;
  }, [completions]);

  // Compute best streak
  const bestCurrentStreak = useMemo(() => {
    return streaks.reduce((max, [, s]) => {
      return Number(s.currentStreak) > max ? Number(s.currentStreak) : max;
    }, 0);
  }, [streaks]);

  // Today's completion %
  const todayCompletionPct = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.round((completedToday.size / habits.length) * 100);
  }, [completedToday, habits]);

  const handleToggle = useCallback(
    (habitId: bigint) => {
      toggleMutation.mutate({ habitId, date: today });
    },
    [toggleMutation],
  );

  const handleMatrixToggle = useCallback(
    (habitId: bigint, date: string) => {
      toggleMutation.mutate(
        { habitId, date },
        {
          onSuccess: () => toast.success("Habit updated!"),
          onError: () => toast.error("Failed to update habit."),
        },
      );
    },
    [toggleMutation],
  );

  const handleAddHabit = useCallback(
    (name: string, emoji: string, color: string) => {
      addHabitMutation.mutate(
        { name, emoji, color },
        {
          onSuccess: () => {
            setIsAddModalOpen(false);
            toast.success(`"${name}" added to your habits!`);
          },
          onError: () => {
            toast.error("Failed to add habit. Please try again.");
          },
        },
      );
    },
    [addHabitMutation, setIsAddModalOpen],
  );

  const handleDeleteHabit = useCallback(
    (habitId: bigint) => {
      const habit = habits.find((h) => h.id === habitId);
      deleteHabitMutation.mutate(
        { habitId },
        {
          onSuccess: () => {
            toast.success(
              `"${habit?.name ?? "Habit"}" removed from your tracker.`,
            );
          },
          onError: () => {
            toast.error("Failed to delete habit. Please try again.");
          },
        },
      );
    },
    [deleteHabitMutation, habits],
  );

  const stats = {
    totalHabits: habits.length,
    todayCompletion: todayCompletionPct,
    bestStreak: bestCurrentStreak,
    weeklyAverage: weeklyCompletedCounts,
  };

  const greeting = userName
    ? `Good ${getGreeting()}, ${userName} 👋`
    : `Good ${getGreeting()}, Champion 👋`;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isAdmin={isAdmin}
        userName={userName}
        userPrincipal={userPrincipal}
        onLogout={onLogout}
        onAdminTokenSubmit={onAdminTokenSubmit}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-base lg:text-lg font-bold text-foreground leading-tight">
                {greeting}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar size={11} />
                <span>{todayDisplay}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {todayCompletionPct === 100 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/20 border border-success/30 text-xs font-semibold text-success"
              >
                <Sparkles size={12} />
                <span>Perfect Day!</span>
              </motion.div>
            )}
            {/* User avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-chart-5 flex items-center justify-center text-xs font-bold text-white">
              {userName
                ? userName.charAt(0).toUpperCase()
                : `${todayCompletionPct}%`}
            </div>
            {/* Logout button (visible on desktop) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="hidden sm:flex text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
            >
              Sign Out
            </Button>
          </div>
        </header>

        <div className="px-4 lg:px-8 py-6 space-y-8 max-w-5xl">
          {/* Admin Dashboard */}
          {activeSection === "admin" && (
            <section id="admin">
              <AdminDashboard isAdmin={isAdmin} />
            </section>
          )}

          {/* Main dashboard content */}
          {activeSection !== "admin" && (
            <>
              {/* Stats Cards */}
              <section id="dashboard">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <SectionHeader
                    label="Overview"
                    title="Your Progress"
                    subtitle="How you're doing today"
                  />
                </motion.div>
                <StatsCards stats={stats} />
              </section>

              {/* Today's Habits */}
              <section id="habits">
                <div className="flex items-end justify-between mb-4">
                  <SectionHeader
                    label="Daily"
                    title="Today's Habits"
                    subtitle={`${format(new Date(), "EEEE, MMMM d")} — stay consistent!`}
                    noMargin
                  />
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    size="sm"
                    className="flex items-center gap-1.5 shrink-0 mb-0.5"
                  >
                    <Plus size={15} />
                    Add Habit
                  </Button>
                </div>
                <div className="card-surface rounded-2xl p-5">
                  <HabitList
                    habits={habits}
                    streaks={streaks}
                    completedToday={completedToday}
                    onToggle={handleToggle}
                    onDelete={handleDeleteHabit}
                  />
                </div>
              </section>

              {/* Weekly Summary */}
              <section id="analytics">
                <SectionHeader
                  label="Weekly"
                  title="Habit Matrix"
                  subtitle="Last 7 days at a glance"
                />
                <div className="card-surface rounded-2xl p-5">
                  <WeeklySummary
                    habits={habits}
                    completions={completions}
                    onToggle={handleMatrixToggle}
                    today={today}
                  />
                </div>
              </section>

              {/* Progress Charts */}
              <section>
                <SectionHeader
                  label="Analytics"
                  title="Progress Charts"
                  subtitle="Completion trends over the past 4 weeks"
                />
                <div className="card-surface rounded-2xl p-5">
                  <ProgressCharts habits={habits} completions={completions} />
                </div>
              </section>
            </>
          )}

          {/* Footer */}
          <footer className="py-6 border-t border-border/30 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()}. Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </footer>
        </div>
      </main>

      <AddHabitModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAdd={handleAddHabit}
        isLoading={addHabitMutation.isPending}
      />

      <ProfileSetupModal
        open={showProfileSetup}
        onSave={onSaveProfile}
        isSaving={isSavingProfile}
      />

      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

function SectionHeader({
  label,
  title,
  subtitle,
  noMargin,
}: {
  label: string;
  title: string;
  subtitle: string;
  noMargin?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={noMargin ? "" : "mb-4"}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
          {label}
        </span>
      </div>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </motion.div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
