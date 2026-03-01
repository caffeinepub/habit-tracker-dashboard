import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type {
  Achievement,
  DetailedStats,
  Habit,
  LeaderboardEntry,
  StreakData,
  UserActivity,
  UserAdminDetail,
  UserProfile,
  WeeklyChallenge,
} from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useInitHabits() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["init-habits"],
    queryFn: async () => {
      if (!actor) return null;
      await actor.initializePredefinedHabits();
      // After init, invalidate habits so they reload fresh from backend
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["completions"] });
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
      return true;
    },
    enabled: !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
}

export function useGetAllHabits() {
  const { actor, isFetching } = useActor();
  return useQuery<Habit[]>({
    queryKey: ["habits"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const habits = await actor.getAllHabits();
        return habits;
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchInterval: 15_000, // re-fetch every 15 seconds
    refetchIntervalInBackground: false,
  });
}

export function useGetStreakData() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Habit, StreakData]>>({
    queryKey: ["streaks"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getStreakData();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

export function useGetCompletions(startDate: string, endDate: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Habit, Array<string>]>>({
    queryKey: ["completions", startDate, endDate],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getCompletionsForRange(startDate, endDate);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

export function useToggleCompletion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      habitId,
      date,
    }: { habitId: bigint; date: string }) => {
      if (!actor) throw new Error("Not connected. Please wait and try again.");
      await actor.toggleCompletion(habitId, date);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["completions"] });
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
    },
  });
}

export function useAddHabit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      emoji,
      color,
      category,
      difficulty = "medium",
    }: {
      name: string;
      emoji: string;
      color: string;
      category: string;
      difficulty?: string;
    }) => {
      if (!actor) throw new Error("Not connected. Please wait and try again.");
      await actor.addHabit(name, emoji, color, category, difficulty);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["completions"] });
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
    },
  });
}

export function useUpdateHabit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      habitId,
      name,
      emoji,
      color,
      category,
      difficulty = "medium",
    }: {
      habitId: bigint;
      name: string;
      emoji: string;
      color: string;
      category: string;
      difficulty?: string;
    }) => {
      if (!actor) throw new Error("Not connected. Please wait and try again.");
      await actor.updateHabit(
        habitId,
        name,
        emoji,
        color,
        category,
        difficulty,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

export function useDeleteHabit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId }: { habitId: bigint }) => {
      if (!actor) return;
      await actor.deleteHabit(habitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["completions"] });
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
    },
  });
}

export function useRecordLogin() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) return;
      await actor.recordLogin();
    },
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principalStr = identity?.getPrincipal().toString() ?? "anonymous";
  return useQuery<boolean>({
    queryKey: ["isAdmin", principalStr],
    queryFn: async () => {
      if (!actor) return false;
      try {
        const result = await actor.isAdmin();
        return result;
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching && principalStr !== "anonymous",
    staleTime: 0, // Always re-check on focus/mount so admin status is fresh
    gcTime: 0,
    // No placeholderData — don't show false while loading
  });
}

export function useGetAdminStats() {
  const { actor, isFetching } = useActor();
  const { data: isAdmin } = useIsAdmin();
  return useQuery<UserActivity[]>({
    queryKey: ["adminStats"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAdminStats();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!isAdmin,
    staleTime: 0,
    refetchInterval: 20_000, // refresh admin stats every 20 seconds
    refetchIntervalInBackground: false,
  });
}

export function useGetAdminUserDetails(isAdminOverride?: boolean) {
  const { actor, isFetching } = useActor();
  const { data: isAdminFromQuery } = useIsAdmin();
  // If override is explicitly true, bypass the query result and treat as admin
  const isAdmin = isAdminOverride === true || !!isAdminFromQuery;
  const today = format(new Date(), "yyyy-MM-dd");
  return useQuery<UserAdminDetail[]>({
    queryKey: ["adminUserDetails", today, isAdminOverride],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAdminUserDetails(today);
      } catch {
        return [];
      }
    },
    // When isAdminOverride is explicitly true, don't block on isFetching from the isAdmin query
    enabled: !!actor && !isFetching && isAdmin,
    staleTime: 0,
    refetchInterval: isAdmin ? 20_000 : false,
    refetchIntervalInBackground: false,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.getCallerUserProfile();
      // Handle both direct null and Motoko optional array format [value] | []
      if (result === null || result === undefined) return null;
      if (Array.isArray(result)) return result.length > 0 ? result[0] : null;
      return result as UserProfile;
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useSetHabitReminderTime() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      habitId,
      reminderTime,
      customMsg = "",
    }: {
      habitId: bigint;
      reminderTime: string;
      customMsg?: string;
    }) => {
      if (!actor) throw new Error("Not connected. Please wait and try again.");
      await actor.setHabitReminderTime(habitId, reminderTime, customMsg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

export function useSaveHabitNote() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      habitId,
      date,
      note,
    }: { habitId: bigint; date: string; note: string }) => {
      if (!actor) throw new Error("Not connected. Please wait and try again.");
      await actor.saveHabitNote(habitId, date, note);
    },
  });
}

export function useGetHabitNotes(habitId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, string]>>({
    queryKey: ["habitNotes", habitId?.toString()],
    queryFn: async () => {
      if (!actor || !habitId) return [];
      try {
        return await actor.getHabitNotes(habitId);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!habitId,
    staleTime: 30_000,
  });
}

export function useSaveMood() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, mood }: { date: string; mood: string }) => {
      if (!actor) throw new Error("Not connected. Please wait and try again.");
      await actor.saveMood(date, mood);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moods"] });
    },
  });
}

export function useGetMoods() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, string]>>({
    queryKey: ["moods"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getMoods();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useSetHabitGoal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      habitId,
      description,
      targetCount,
      deadline,
    }: {
      habitId: bigint;
      description: string;
      targetCount: bigint;
      deadline: string;
    }) => {
      if (!actor) throw new Error("Not connected. Please wait and try again.");
      await actor.setHabitGoal(habitId, description, targetCount, deadline);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

export function useGetWeeklyChallenge() {
  const { actor, isFetching } = useActor();
  return useQuery<WeeklyChallenge | null>({
    queryKey: ["weeklyChallenge"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getWeeklyChallenge();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function useSetWeeklyChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
      targetCompletionsPerDay,
      deadline,
    }: {
      title: string;
      description: string;
      targetCompletionsPerDay: bigint;
      deadline: string;
    }) => {
      if (!actor) throw new Error("Not connected. Please wait and try again.");
      await actor.setWeeklyChallenge(
        title,
        description,
        targetCompletionsPerDay,
        deadline,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weeklyChallenge"] });
    },
  });
}

export function useJoinWeeklyChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected. Please wait and try again.");
      await actor.joinWeeklyChallenge();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weeklyChallenge"] });
    },
  });
}

export function useGetChallengeMembersCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["challengeMembers"],
    queryFn: async () => {
      if (!actor) return 0n;
      try {
        return await actor.getChallengeMembersCount();
      } catch {
        return 0n;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ principalStr }: { principalStr: string }) => {
      if (!actor) throw new Error("Not connected. Please wait and try again.");
      const { Principal } = await import("@icp-sdk/core/principal");
      await actor.followUser(Principal.fromText(principalStr));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["friendLeaderboard"] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ principalStr }: { principalStr: string }) => {
      if (!actor) throw new Error("Not connected. Please wait and try again.");
      const { Principal } = await import("@icp-sdk/core/principal");
      await actor.unfollowUser(Principal.fromText(principalStr));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["friendLeaderboard"] });
    },
  });
}

export function useGetFollowing() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["following"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getFollowing();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useGetFriendLeaderboard() {
  const { actor, isFetching } = useActor();
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["friendLeaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getFriendLeaderboard();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useGetAchievements() {
  const { actor, isFetching } = useActor();
  return useQuery<Achievement[]>({
    queryKey: ["achievements"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAchievements();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

export function useGetDetailedStats(todayDate: string) {
  const { actor, isFetching } = useActor();
  return useQuery<DetailedStats | null>({
    queryKey: ["detailedStats", todayDate],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getDetailedStats(todayDate);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useRemoveUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ principal }: { principal: string }) => {
      if (!actor) throw new Error("Not connected. Please wait and try again.");
      // Import Principal from the icp-sdk
      const { Principal } = await import("@icp-sdk/core/principal");
      await actor.removeUser(Principal.fromText(principal));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUserDetails"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useAddPoints() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pts }: { pts: bigint }) => {
      if (!actor) throw new Error("Not connected. Please wait and try again.");
      await actor.addPoints(pts);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useReorderHabits() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ order }: { order: bigint[] }) => {
      if (!actor) throw new Error("Not connected. Please wait and try again.");
      await actor.reorderHabits(order);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useSpendStreakToken() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      habitId,
      missedDate,
    }: { habitId: bigint; missedDate: string }) => {
      if (!actor) throw new Error("Not connected. Please wait and try again.");
      await actor.spendStreakToken(habitId, missedDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
      queryClient.invalidateQueries({ queryKey: ["completions"] });
    },
  });
}

export function useGetLeaderboard() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getLeaderboard();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}
