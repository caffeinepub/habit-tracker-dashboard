# Habit Tracker Dashboard

## Current State
- Full-stack app with Internet Identity login, per-user habits, weekly matrix, progress charts, admin dashboard
- Users set their name and mobile number during first-login profile setup (ProfileSetupModal)
- Profile is saved via `saveCallerUserProfile` and loaded via `getCallerUserProfile`
- Backend already has `UserProfile { name: Text; mobile: Text }` and functions to read/write it
- Sidebar has: Dashboard, Habits, Analytics, Admin (admin only), Admin Access (non-admins), user info at bottom
- No Settings page exists yet; users cannot update their profile after initial setup

## Requested Changes (Diff)

### Add
- Settings page (`SettingsPage` component) accessible from the sidebar
- "Settings" nav item in the sidebar (gear icon), visible to all logged-in users
- Settings form with two fields: Display Name and Mobile Number
- Pre-populated with the user's current profile values on load
- Save button that calls `saveCallerUserProfile` to persist changes
- Success/error toast feedback on save

### Modify
- `Sidebar.tsx`: add "Settings" nav item (between Analytics and Admin Access)
- `App.tsx`: handle `activeSection === "settings"` to render the SettingsPage, pass current profile data and save handler

### Remove
- Nothing

## Implementation Plan
1. Create `src/frontend/src/components/dashboard/SettingsPage.tsx` with a form for name and mobile number
2. Add "Settings" nav item to `NAV_ITEMS` in `Sidebar.tsx` with a Settings/gear icon
3. In `App.tsx` (`AuthenticatedApp`), add a `settings` section render that passes `userProfile` and `handleSaveProfile`
4. Pass `userProfile` down to `AuthenticatedApp` so the Settings page can pre-populate fields
5. Validate mobile is non-empty before saving (required field)
