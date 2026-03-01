import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { Calendar, Menu, Plus, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Habit, UserProfile } from "./backend.d";
import { AchievementsPage } from "./components/dashboard/AchievementsPage";
import { AddHabitModal } from "./components/dashboard/AddHabitModal";
import { AdminDashboard } from "./components/dashboard/AdminDashboard";
import { AdminDirectView } from "./components/dashboard/AdminDirectView";
import { BottomTabBar } from "./components/dashboard/BottomTabBar";
import { ConfettiCelebration } from "./components/dashboard/ConfettiCelebration";
import { DetailedStatsPage } from "./components/dashboard/DetailedStatsPage";
import { EditHabitModal } from "./components/dashboard/EditHabitModal";
import { HabitList } from "./components/dashboard/HabitList";
import { KeyboardShortcutsPanel } from "./components/dashboard/KeyboardShortcutsPanel";
import { LeaderboardPage } from "./components/dashboard/LeaderboardPage";
import { LoginScreen } from "./components/dashboard/LoginScreen";
import { MoodPicker } from "./components/dashboard/MoodPicker";
import { MotivationalQuote } from "./components/dashboard/MotivationalQuote";
import { PWAInstallBanner } from "./components/dashboard/PWAInstallBanner";
import { ProfileSetupModal } from "./components/dashboard/ProfileSetupModal";
import { ProgressCharts } from "./components/dashboard/ProgressCharts";
import { ReminderBanners } from "./components/dashboard/ReminderBanner";
import { SettingsPage } from "./components/dashboard/SettingsPage";
import { Sidebar } from "./components/dashboard/Sidebar";
import { StatsCards } from "./components/dashboard/StatsCards";
import { WeeklySummary } from "./components/dashboard/WeeklySummary";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { usePWAInstall } from "./hooks/usePWAInstall";
import {
  useAddHabit,
  useAddPoints,
  useDeleteHabit,
  useGetAllHabits,
  useGetCallerUserProfile,
  useGetCompletions,
  useGetStreakData,
  useGetWeeklyChallenge,
  useInitHabits,
  useIsAdmin,
  useRecordLogin,
  useReorderHabits,
  useSaveCallerUserProfile,
  useSaveMood,
  useSetHabitReminderTime,
  useSpendStreakToken,
  useToggleCompletion,
  useUpdateHabit,
} from "./hooks/useQueries";
import { useReminderScheduler } from "./hooks/useReminderScheduler";
import { useTheme } from "./hooks/useTheme";

const today = format(new Date(), "yyyy-MM-dd");
const pastDate = format(subDays(new Date(), 27), "yyyy-MM-dd");
const todayDisplay = format(new Date(), "EEEE, MMMM d");

const HARDCODED_ADMIN_PRINCIPAL =
  "h3k33-vzkys-gtpvb-j7eqr-rvkzy-mzzsd-ll3yr-u36x5-hfopd-jkaib-hae";

const adminDirectPrincipal = (() => {
  const hash = window.location.hash;
  const match = hash.match(/adminDirect=([^&]+)/);
  return match ? match[1] : null;
})();

const isAdminDirectAccess = adminDirectPrincipal === HARDCODED_ADMIN_PRINCIPAL;

// Difficulty → points mapping
const DIFFICULTY_POINTS: Record<string, bigint> = {
  easy: 10n,
  medium: 20n,
  hard: 30n,
};

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
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

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

  const recordLoginMutateFn = recordLoginMutation.mutate;
  useEffect(() => {
    if (isAuthenticated && !hasRecordedLogin && !profileLoading) {
      setHasRecordedLogin(true);
      recordLoginMutateFn();
    }
  }, [isAuthenticated, hasRecordedLogin, profileLoading, recordLoginMutateFn]);

  // Apply accent color from profile
  useEffect(() => {
    const color = userProfile?.accentColor;
    if (color) {
      document.documentElement.style.setProperty("--accent-custom", color);
    }
  }, [userProfile?.accentColor]);

  const handleLogout = useCallback(() => {
    clear();
    queryClient.clear();
    setHasRecordedLogin(false);
    setActiveSection("dashboard");
  }, [clear, queryClient]);

  const handleSaveProfile = useCallback(
    (
      name: string,
      mobile: string,
      avatarBase64?: string,
      accentColor?: string,
    ) => {
      const existingProfile: UserProfile = userProfile ?? {
        name: "",
        mobile: "",
        avatarBase64: "",
        accentColor: "",
        streakTokens: 0n,
        points: 0n,
        habitOrder: [],
      };
      saveProfileMutation.mutate(
        {
          ...existingProfile,
          name,
          mobile,
          avatarBase64: avatarBase64 ?? existingProfile.avatarBase64,
          accentColor: accentColor ?? existingProfile.accentColor,
        },
        {
          onSuccess: () => toast.success("Profile saved!"),
          onError: () => toast.error("Failed to save profile."),
        },
      );
    },
    [saveProfileMutation, userProfile],
  );

  const { resolvedTheme } = useTheme();
  const toasterTheme = resolvedTheme === "light" ? "light" : "dark";

  if (isAdminDirectAccess) {
    return (
      <>
        <AdminDirectView
          isAuthenticated={isAuthenticated}
          onLogin={login}
          isLoggingIn={isLoggingIn || isInitializing}
        />
        <Toaster position="bottom-right" theme={toasterTheme} />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen
          onLogin={login}
          isLoggingIn={isLoggingIn || isInitializing}
        />
        <Toaster position="bottom-right" theme={toasterTheme} />
      </>
    );
  }

  const userPrincipal = identity?.getPrincipal().toString();

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
      editingHabit={editingHabit}
      setEditingHabit={setEditingHabit}
      isAdmin={!!isAdmin || tokenUnlockedAdmin}
      userName={userProfile?.name}
      userPrincipal={userPrincipal}
      userProfile={userProfile ?? null}
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
  editingHabit: Habit | null;
  setEditingHabit: (habit: Habit | null) => void;
  isAdmin: boolean;
  userName?: string;
  userPrincipal?: string;
  userProfile: UserProfile | null;
  onLogout: () => void;
  showProfileSetup: boolean;
  onSaveProfile: (
    name: string,
    mobile: string,
    avatarBase64?: string,
    accentColor?: string,
  ) => void;
  isSavingProfile: boolean;
  onAdminTokenSubmit: (token: string) => void;
}

function getLevelInfo(points: number): { label: string; color: string } {
  if (points >= 5000) return { label: "Master", color: "#f59e0b" };
  if (points >= 2000) return { label: "Expert", color: "#8b5cf6" };
  if (points >= 500) return { label: "Intermediate", color: "#3b82f6" };
  return { label: "Beginner", color: "#6b7280" };
}

function AuthenticatedApp({
  activeSection,
  setActiveSection,
  isSidebarOpen,
  setIsSidebarOpen,
  isAddModalOpen,
  setIsAddModalOpen,
  editingHabit,
  setEditingHabit,
  isAdmin,
  userName,
  userPrincipal,
  userProfile,
  onLogout,
  showProfileSetup,
  onSaveProfile,
  isSavingProfile,
  onAdminTokenSubmit,
}: AuthenticatedAppProps) {
  const { isInstallable, promptInstall } = usePWAInstall();
  useInitHabits();

  const { data: habits = [] } = useGetAllHabits();
  const { data: streaks = [] } = useGetStreakData();
  const { data: completions = [] } = useGetCompletions(pastDate, today);
  const { data: weeklyChallenge } = useGetWeeklyChallenge();
  const toggleMutation = useToggleCompletion();
  const addHabitMutation = useAddHabit();
  const deleteHabitMutation = useDeleteHabit();
  const updateHabitMutation = useUpdateHabit();
  const setReminderMutation = useSetHabitReminderTime();
  const addPointsMutation = useAddPoints();
  const reorderHabitsMutation = useReorderHabits();
  const spendStreakTokenMutation = useSpendStreakToken();
  const saveMoodMutation = useSaveMood();

  useReminderScheduler(habits);

  const completedToday = useMemo(() => {
    const set = new Set<string>();
    for (const [habit, dates] of completions) {
      if (dates.includes(today)) {
        set.add(habit.id.toString());
      }
    }
    return set;
  }, [completions]);

  // Quick-add ref (for keyboard shortcut)
  const quickAddInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts panel
  const [showShortcutsPanel, setShowShortcutsPanel] = useState(false);

  // Mood picker state
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const moodShownRef = useRef(false);

  // Streak-at-risk alert (8 PM check)
  const streakRiskShownRef = useRef(false);
  useEffect(() => {
    const checkStreakRisk = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const dateStr = format(now, "yyyy-MM-dd");

      if (h === 20 && m === 0 && !streakRiskShownRef.current) {
        for (const [habit, streakData] of streaks) {
          if (
            Number(streakData.currentStreak) > 0 &&
            !completedToday.has(habit.id.toString())
          ) {
            const key = `streak-risk-${dateStr}-${habit.id.toString()}`;
            if (!localStorage.getItem(key)) {
              localStorage.setItem(key, "1");
              toast.warning(
                `⚠️ Don't break your streak for "${habit.name}"! Complete it before midnight.`,
                { duration: 8000 },
              );
            }
          }
        }
        streakRiskShownRef.current = true;
      }
      // Reset daily
      if (h === 0 && m === 0) {
        streakRiskShownRef.current = false;
      }
    };
    checkStreakRisk();
    const interval = setInterval(checkStreakRisk, 60_000);
    return () => clearInterval(interval);
  }, [streaks, completedToday]);

  // Streak at-risk habit IDs (for showing indicator on rows)
  const streakRiskHabitIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [habit, streakData] of streaks) {
      if (
        Number(streakData.currentStreak) > 0 &&
        !completedToday.has(habit.id.toString())
      ) {
        ids.add(habit.id.toString());
      }
    }
    return ids;
  }, [streaks, completedToday]);

  // End-of-day summary at 9 PM
  const eodShownRef = useRef(false);
  useEffect(() => {
    const checkEOD = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const key = `eod-summary-${format(now, "yyyy-MM-dd")}`;
      if (
        h === 21 &&
        m === 0 &&
        !eodShownRef.current &&
        !localStorage.getItem(key)
      ) {
        eodShownRef.current = true;
        localStorage.setItem(key, "1");
        const total = habits.length;
        const done = completedToday.size;
        toast.success(
          `Day Complete! You finished ${done}/${total} habits today 🎯`,
          { duration: 8000 },
        );
      }
    };
    checkEOD();
    const interval = setInterval(checkEOD, 60_000);
    return () => clearInterval(interval);
  }, [habits.length, completedToday.size]);

  // Listen for "Mark Done" clicks from reminder toasts
  useEffect(() => {
    const handler = (e: Event) => {
      const habitIdStr = (e as CustomEvent<{ habitId: string }>).detail
        ?.habitId;
      if (!habitIdStr) return;
      const habit = habits.find((h) => h.id.toString() === habitIdStr);
      if (habit && !completedToday.has(habitIdStr)) {
        toggleMutation.mutate(
          { habitId: habit.id, date: today },
          { onSuccess: () => toast.success(`"${habit.name}" marked as done!`) },
        );
      }
    };
    window.addEventListener("habitReminderMarkDone", handler);
    return () => window.removeEventListener("habitReminderMarkDone", handler);
  }, [habits, completedToday, toggleMutation]);

  const handleSetReminder = useCallback(
    (habitId: bigint, time: string, customMsg = "") => {
      setReminderMutation.mutate(
        { habitId, reminderTime: time, customMsg },
        {
          onSuccess: () =>
            toast.success(
              time ? `Reminder set for ${time}` : "Reminder cleared",
            ),
          onError: (err) =>
            toast.error(
              err instanceof Error ? err.message : "Failed to set reminder",
            ),
        },
      );
    },
    [setReminderMutation],
  );

  const handleBannerMarkDone = useCallback(
    (habitIdStr: string) => {
      const habit = habits.find((h) => h.id.toString() === habitIdStr);
      if (habit && !completedToday.has(habitIdStr)) {
        toggleMutation.mutate(
          { habitId: habit.id, date: today },
          { onSuccess: () => toast.success(`"${habit.name}" marked as done!`) },
        );
      }
    },
    [habits, completedToday, toggleMutation],
  );

  // Compute weekly completions
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

  const bestCurrentStreak = useMemo(() => {
    return streaks.reduce((max, [, s]) => {
      return Number(s.currentStreak) > max ? Number(s.currentStreak) : max;
    }, 0);
  }, [streaks]);

  const todayCompletionPct = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.round((completedToday.size / habits.length) * 100);
  }, [completedToday, habits]);

  // Confetti: trigger when all habits done
  const allDone = habits.length > 0 && completedToday.size === habits.length;

  // Bonus points: award once per day when all done + trigger mood picker
  const bonusAwardedRef = useRef(false);
  useEffect(() => {
    if (!allDone) {
      moodShownRef.current = false;
      return;
    }
    const bonusKey = `bonus-points-${today}`;
    if (localStorage.getItem(bonusKey) || bonusAwardedRef.current) return;
    bonusAwardedRef.current = true;
    localStorage.setItem(bonusKey, "1");
    addPointsMutation.mutate({ pts: 50n });
    toast.success("🎉 All habits done! +50 bonus points!", { duration: 5000 });

    // Show mood picker after confetti (slight delay)
    const moodKey = `mood-shown-${today}`;
    if (!localStorage.getItem(moodKey) && !moodShownRef.current) {
      moodShownRef.current = true;
      setTimeout(() => setShowMoodPicker(true), 2200);
    }
  }, [allDone, addPointsMutation]);

  const handleSaveMood = useCallback(
    (mood: string) => {
      const moodKey = `mood-shown-${today}`;
      localStorage.setItem(moodKey, "1");
      saveMoodMutation.mutate({ date: today, mood });
      toast.success("Mood saved!");
    },
    [saveMoodMutation],
  );

  const handleToggle = useCallback(
    (habitId: bigint) => {
      const isCurrentlyDone = completedToday.has(habitId.toString());
      const habit = habits.find((h) => h.id === habitId);
      toggleMutation.mutate(
        { habitId, date: today },
        {
          onSuccess: () => {
            // Award points based on difficulty when marking as done
            if (!isCurrentlyDone && habit) {
              const pts =
                DIFFICULTY_POINTS[habit.difficulty] ??
                DIFFICULTY_POINTS.medium ??
                10n;
              addPointsMutation.mutate({ pts });
            }
          },
        },
      );
    },
    [toggleMutation, completedToday, addPointsMutation, habits],
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

  // Complete All handler
  const handleCompleteAll = useCallback(() => {
    const incomplete = habits.filter(
      (h) => !completedToday.has(h.id.toString()),
    );
    if (incomplete.length === 0) return;

    const promises = incomplete.map((h) =>
      toggleMutation.mutateAsync({ habitId: h.id, date: today }),
    );

    Promise.all(promises)
      .then(() => {
        toast.success(`✅ Completed all ${incomplete.length} habits!`, {
          duration: 4000,
        });
        // Award difficulty-based points for each
        const totalPts = incomplete.reduce((sum, h) => {
          return (
            sum +
            (DIFFICULTY_POINTS[h.difficulty] ?? DIFFICULTY_POINTS.medium ?? 10n)
          );
        }, 0n);
        addPointsMutation.mutate({ pts: totalPts });
      })
      .catch(() => {
        toast.error("Failed to complete some habits. Please try again.");
      });
  }, [habits, completedToday, toggleMutation, addPointsMutation]);

  // Quick-add handler
  const handleQuickAdd = useCallback(
    (name: string, emoji: string) => {
      addHabitMutation.mutate(
        {
          name,
          emoji,
          color: "#6366f1",
          category: "Other",
          difficulty: "medium",
        },
        {
          onSuccess: () => toast.success(`"${name}" added!`),
          onError: () => toast.error("Failed to add habit. Please try again."),
        },
      );
    },
    [addHabitMutation],
  );

  const handleAddHabit = useCallback(
    (
      name: string,
      emoji: string,
      color: string,
      category: string,
      difficulty: string,
    ) => {
      addHabitMutation.mutate(
        { name, emoji, color, category, difficulty },
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

  const handleOpenEditModal = useCallback(
    (habitId: bigint) => {
      const habit = habits.find((h) => h.id === habitId);
      if (habit) setEditingHabit(habit);
    },
    [habits, setEditingHabit],
  );

  const handleEditHabit = useCallback(
    (
      habitId: bigint,
      name: string,
      emoji: string,
      color: string,
      category: string,
      difficulty: string,
    ) => {
      updateHabitMutation.mutate(
        { habitId, name, emoji, color, category, difficulty },
        {
          onSuccess: () => {
            setEditingHabit(null);
            toast.success(`"${name}" updated successfully!`);
          },
          onError: () => {
            toast.error("Failed to update habit. Please try again.");
          },
        },
      );
    },
    [updateHabitMutation, setEditingHabit],
  );

  // Drag-and-drop reorder handler
  const handleReorder = useCallback(
    (newOrder: bigint[]) => {
      const existingProfile: UserProfile = userProfile ?? {
        name: "",
        mobile: "",
        avatarBase64: "",
        accentColor: "",
        streakTokens: 0n,
        points: 0n,
        habitOrder: [],
      };
      reorderHabitsMutation.mutate(
        { order: newOrder },
        {
          onError: () => toast.error("Failed to save habit order."),
        },
      );
      void existingProfile;
    },
    [reorderHabitsMutation, userProfile],
  );

  // Streak freeze handler
  const handleStreakFreeze = useCallback(
    (habitId: bigint) => {
      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
      const tokens = Number(userProfile?.streakTokens ?? 0n);
      if (tokens <= 0) {
        toast.error("No streak freeze tokens available.");
        return;
      }
      spendStreakTokenMutation.mutate(
        { habitId, missedDate: yesterday },
        {
          onSuccess: () =>
            toast.success("❄️ Streak freeze used! Your streak is protected."),
          onError: () => toast.error("Failed to use streak freeze."),
        },
      );
    },
    [spendStreakTokenMutation, userProfile],
  );

  // Keyboard shortcuts toggle
  const handleToggleHabitByIndex = useCallback(
    (index: number) => {
      if (index < habits.length) {
        handleToggle(habits[index].id);
      }
    },
    [habits, handleToggle],
  );

  // Wire keyboard shortcuts
  useKeyboardShortcuts({
    onAddHabit: () => setIsAddModalOpen(true),
    onCompleteAll: handleCompleteAll,
    onToggleHabitByIndex: handleToggleHabitByIndex,
    onFocusQuickAdd: () => {
      setActiveSection("dashboard");
      setTimeout(() => quickAddInputRef.current?.focus(), 100);
    },
    onCloseModal: () => {
      setIsAddModalOpen(false);
      setEditingHabit(null);
      setShowShortcutsPanel(false);
    },
    onToggleShortcutsPanel: () => setShowShortcutsPanel((v) => !v),
    isModalOpen: isAddModalOpen || !!editingHabit,
  });

  const stats = {
    totalHabits: habits.length,
    todayCompletion: todayCompletionPct,
    bestStreak: bestCurrentStreak,
    weeklyAverage: weeklyCompletedCounts,
    streakTokens: userProfile ? Number(userProfile.streakTokens) : undefined,
    points: userProfile ? Number(userProfile.points) : undefined,
  };

  const userPoints = userProfile ? Number(userProfile.points) : 0;
  const levelInfo = getLevelInfo(userPoints);

  const greeting = userName
    ? `Good ${getGreeting()}, ${userName} 👋`
    : `Good ${getGreeting()}, Champion 👋`;

  const isMainSection =
    activeSection !== "admin" &&
    activeSection !== "settings" &&
    activeSection !== "achievements" &&
    activeSection !== "stats" &&
    activeSection !== "leaderboard";

  return (
    <div className="flex min-h-screen bg-background">
      {/* PWA Install Banner */}
      <PWAInstallBanner
        isInstallable={isInstallable}
        promptInstall={promptInstall}
      />

      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isAdmin={isAdmin}
        userName={userName}
        userPrincipal={userPrincipal}
        userPoints={userPoints}
        avatarBase64={userProfile?.avatarBase64 || undefined}
        onLogout={onLogout}
        onAdminTokenSubmit={onAdminTokenSubmit}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0 pb-20 lg:pb-0">
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
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/20 border border-success/30 text-xs font-semibold text-success"
              >
                <Sparkles size={12} />
                <span>Perfect Day!</span>
              </motion.div>
            )}
            {/* Theme toggle */}
            <ThemeToggle />
            {/* User avatar + level badge */}
            <div className="relative">
              <div
                className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white border-2 border-border/30"
                style={{
                  background: userProfile?.avatarBase64
                    ? "transparent"
                    : "linear-gradient(135deg, oklch(0.62 0.22 290), oklch(0.68 0.18 330))",
                }}
              >
                {userProfile?.avatarBase64 ? (
                  <img
                    src={userProfile.avatarBase64}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : userName ? (
                  userName.charAt(0).toUpperCase()
                ) : (
                  `${todayCompletionPct}%`
                )}
              </div>
              {/* Level badge */}
              <span
                className="absolute -bottom-1 -right-1 text-[8px] font-bold px-1 py-0.5 rounded-full hidden sm:block"
                style={{
                  backgroundColor: levelInfo.color,
                  color: "#fff",
                  lineHeight: 1,
                }}
              >
                {levelInfo.label.slice(0, 3)}
              </span>
            </div>
            {/* Logout button */}
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

        <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-6 lg:space-y-8 max-w-5xl">
          {/* Admin Dashboard */}
          {activeSection === "admin" && (
            <section id="admin">
              <AdminDashboard isAdmin={isAdmin} />
            </section>
          )}

          {/* Settings page */}
          {activeSection === "settings" && (
            <section id="settings">
              <SettingsPage
                currentName={userProfile?.name}
                currentMobile={userProfile?.mobile}
                currentAvatarBase64={userProfile?.avatarBase64 || undefined}
                currentAccentColor={userProfile?.accentColor || undefined}
                onSave={onSaveProfile}
                isSaving={isSavingProfile}
              />
            </section>
          )}

          {/* Achievements page */}
          {activeSection === "achievements" && (
            <section id="achievements">
              <AchievementsPage />
            </section>
          )}

          {/* Detailed Stats page */}
          {activeSection === "stats" && (
            <section id="stats">
              <DetailedStatsPage />
            </section>
          )}

          {/* Leaderboard page */}
          {activeSection === "leaderboard" && (
            <section id="leaderboard">
              <LeaderboardPage currentUserPrincipal={userPrincipal} />
            </section>
          )}

          {/* Main dashboard content */}
          {isMainSection && (
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

                {/* Motivational quote */}
                <div className="mb-4">
                  <MotivationalQuote />
                </div>

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
                    completions={completions}
                    onToggle={handleToggle}
                    onDelete={handleDeleteHabit}
                    onEdit={handleOpenEditModal}
                    onSetReminder={handleSetReminder}
                    onAddFirst={() => setIsAddModalOpen(true)}
                    onQuickAdd={handleQuickAdd}
                    onCompleteAll={handleCompleteAll}
                    onStreakFreeze={handleStreakFreeze}
                    streakRiskHabitIds={streakRiskHabitIds}
                    isQuickAddLoading={addHabitMutation.isPending}
                    quickAddInputRef={quickAddInputRef}
                    habitOrder={userProfile?.habitOrder}
                    onReorder={handleReorder}
                    weeklyChallenge={weeklyChallenge ?? null}
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

      <EditHabitModal
        open={!!editingHabit}
        onOpenChange={(open) => {
          if (!open) setEditingHabit(null);
        }}
        habit={editingHabit}
        onEdit={handleEditHabit}
        isLoading={updateHabitMutation.isPending}
      />

      <ProfileSetupModal
        open={showProfileSetup}
        onSave={(name, mobile, avatarBase64) =>
          onSaveProfile(name, mobile, avatarBase64)
        }
        isSaving={isSavingProfile}
      />

      {/* Mood Picker */}
      <MoodPicker
        open={showMoodPicker}
        onOpenChange={setShowMoodPicker}
        date={today}
        onSave={handleSaveMood}
      />

      {/* Confetti celebration */}
      <ConfettiCelebration trigger={allDone} />

      {/* Keyboard shortcuts panel */}
      <KeyboardShortcutsPanel
        open={showShortcutsPanel}
        onClose={() => setShowShortcutsPanel(false)}
      />

      {/* Reminder banners */}
      <ReminderBanners onMarkDone={handleBannerMarkDone} />

      {/* Bottom tab bar (mobile only) */}
      <BottomTabBar
        activeSection={activeSection}
        onSectionChange={(id) => {
          setActiveSection(id);
          setIsSidebarOpen(false);
        }}
      />

      <ToasterWithTheme />
    </div>
  );
}

function ToasterWithTheme() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      theme={resolvedTheme === "light" ? "light" : "dark"}
    />
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
