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
    lastLogin: bigint;
    weeklyCompletionRate: bigint;
}
export type HabitId = bigint;
export interface Habit {
    id: HabitId;
    name: string;
    color: string;
    emoji: string;
}
export interface UserProfile {
    name: string;
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
    addHabit(name: string, emoji: string, color: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteHabit(habitId: HabitId): Promise<void>;
    getAdminStats(): Promise<Array<UserActivity>>;
    getAdminUserDetails(_todayDate: string): Promise<Array<UserAdminDetail>>;
    getAllHabits(): Promise<Array<Habit>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompletionsForRange(startDate: string, endDate: string): Promise<Array<[Habit, Array<string>]>>;
    getStreakData(): Promise<Array<[Habit, StreakData]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializePredefinedHabits(): Promise<void>;
    isAdmin(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    recordLogin(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setAdminPrincipal(newAdmin: Principal): Promise<void>;
    toggleCompletion(habitId: HabitId, date: string): Promise<void>;
}
