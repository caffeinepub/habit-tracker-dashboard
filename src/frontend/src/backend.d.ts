import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface StreakData {
    bestStreak: bigint;
    currentStreak: bigint;
}
export interface UserAdminDetail {
    principal: string;
    displayName: string;
    completionsToday: bigint;
    habits: Array<Habit>;
    firstLogin: bigint;
    mobile: string;
    lastLogin: bigint;
    weeklyCompletionRate: bigint;
}
export interface LeaderboardEntry {
    principal: string;
    displayName: string;
    points: bigint;
}
export interface DetailedStats {
    totalDaysTracked: bigint;
    totalCompletions: bigint;
    currentStreakDays: bigint;
    habitsCompletedToday: bigint;
    bestStreakEver: bigint;
    averageCompletionRate: bigint;
}
export interface Achievement {
    id: string;
    name: string;
    description: string;
    earnedAt: bigint;
    earned: boolean;
}
export interface WeeklyChallenge {
    title: string;
    createdAt: bigint;
    description: string;
    deadline: string;
    setBy: string;
    targetCompletionsPerDay: bigint;
}
export type HabitId = bigint;
export interface Habit {
    id: HabitId;
    goalTargetCount: bigint;
    difficulty: string;
    name: string;
    color: string;
    goalDeadline: string;
    emoji: string;
    reminderTime: string;
    category: string;
    customReminderMsg: string;
    goalDescription: string;
}
export interface UserProfile {
    habitOrder: Array<bigint>;
    name: string;
    accentColor: string;
    avatarBase64: string;
    streakTokens: bigint;
    mobile: string;
    points: bigint;
}
export interface UserActivity {
    principal: string;
    habitCount: bigint;
    firstLogin: bigint;
    lastLogin: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addHabit(name: string, emoji: string, color: string, category: string, difficulty: string): Promise<void>;
    addPoints(pts: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteHabit(habitId: HabitId): Promise<void>;
    followUser(target: Principal): Promise<void>;
    getAchievements(): Promise<Array<Achievement>>;
    getAdminStats(): Promise<Array<UserActivity>>;
    getAdminUserDetails(todayDate: string): Promise<Array<UserAdminDetail>>;
    getAllHabits(): Promise<Array<Habit>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChallengeMembersCount(): Promise<bigint>;
    getCompletionsForRange(startDate: string, endDate: string): Promise<Array<[Habit, Array<string>]>>;
    getDetailedStats(todayDate: string): Promise<DetailedStats>;
    getFollowing(): Promise<Array<string>>;
    getFriendLeaderboard(): Promise<Array<LeaderboardEntry>>;
    getHabitNotes(habitId: HabitId): Promise<Array<[string, string]>>;
    getLeaderboard(): Promise<Array<LeaderboardEntry>>;
    getMoods(): Promise<Array<[string, string]>>;
    getStreakData(): Promise<Array<[Habit, StreakData]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWeeklyChallenge(): Promise<WeeklyChallenge | null>;
    initializePredefinedHabits(): Promise<void>;
    isAdmin(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    joinWeeklyChallenge(): Promise<void>;
    recordLogin(): Promise<void>;
    removeUser(user: Principal): Promise<void>;
    reorderHabits(order: Array<HabitId>): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveHabitNote(habitId: HabitId, date: string, note: string): Promise<void>;
    saveMood(date: string, mood: string): Promise<void>;
    setAdminPrincipal(newAdmin: Principal): Promise<void>;
    setHabitGoal(habitId: HabitId, description: string, targetCount: bigint, deadline: string): Promise<void>;
    setHabitReminderTime(habitId: HabitId, reminderTime: string, customMsg: string): Promise<void>;
    setWeeklyChallenge(title: string, description: string, targetCompletionsPerDay: bigint, deadline: string): Promise<void>;
    spendStreakToken(habitId: HabitId, missedDate: string): Promise<void>;
    toggleCompletion(habitId: HabitId, date: string): Promise<void>;
    unfollowUser(target: Principal): Promise<void>;
    updateHabit(habitId: HabitId, name: string, emoji: string, color: string, category: string, difficulty: string): Promise<void>;
}
