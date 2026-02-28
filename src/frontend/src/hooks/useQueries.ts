import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type {
  Habit,
  StreakData,
  UserActivity,
  UserAdminDetail,
  UserProfile,
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
      if (!actor) return;
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
    }: { name: string; emoji: string; color: string }) => {
      if (!actor) return;
      await actor.addHabit(name, emoji, color);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["completions"] });
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
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

export function useGetAdminUserDetails() {
  const { actor, isFetching } = useActor();
  const { data: isAdmin } = useIsAdmin();
  const today = format(new Date(), "yyyy-MM-dd");
  return useQuery<UserAdminDetail[]>({
    queryKey: ["adminUserDetails", today],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAdminUserDetails(today);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!isAdmin,
    staleTime: 0,
    refetchInterval: 20_000, // refresh admin user details every 20 seconds
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
