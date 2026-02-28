# Habit Tracker Dashboard

## Current State
Full-stack habit tracker with Internet Identity login, per-user habits, weekly matrix, progress charts, WhatsApp reminders, and an admin dashboard. Admin is permanently hardcoded as principal `h3k33-vzkys-gtpvb-j7eqr-rvkzy-mzzsd-ll3yr-u36x5-hfopd-jkaib-hae`.

The admin dashboard shows user cards with name, mobile, habits, activity status, weekly completion rate. It fetches via `getAdminUserDetails(todayDate)`.

**Bug:** The admin dashboard only shows 2 users even though many more have logged in and added habits. Two root causes:
1. **Frontend:** `useGetAdminUserDetails` was only enabled when `isAdmin` query resolved to true. When accessing via token, the backend `isAdmin()` query might return false (race condition or anonymous call), so the data query never runs.
2. **Backend:** `getAdminUserDetails` only iterates over `userActivity` map. Users whose `recordLogin()` call failed or never completed are invisible to the admin. Must union across `userActivity`, `userProfiles`, AND `userHabits` to capture all known users.

## Requested Changes (Diff)

### Add
- Backend: collect all known users from the union of `userActivity`, `userProfiles`, and `userHabits` maps in `getAdminUserDetails`

### Modify
- Backend: `getAdminUserDetails` -- iterate over all known users (union of all 3 maps), not just `userActivity`
- Backend: `weeklyCompletionRate` computation -- use plain `Nat` division instead of `Nat8.fromNat` to avoid overflow/trap
- Frontend: `useGetAdminUserDetails` hook -- accept an optional `isAdminOverride: boolean` parameter; when `true`, enable the query regardless of the `useIsAdmin()` query result
- Frontend: `AdminDashboard` -- pass `isAdmin === true` as the override to `useGetAdminUserDetails`

### Remove
- Nothing

## Implementation Plan
1. Regenerate backend Motoko so `getAdminUserDetails` iterates union of all 3 data maps, and weeklyCompletionRate uses safe Nat division
2. Update `useGetAdminUserDetails` in `useQueries.ts` to accept `isAdminOverride` param (already done)
3. Update `AdminDashboard.tsx` to pass override (already done)
4. Build and deploy
