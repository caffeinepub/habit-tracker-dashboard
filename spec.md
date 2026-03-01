# Habit Tracker Dashboard

## Current State
- Full-stack habit tracker with React frontend and Motoko backend on ICP
- Desktop-first layout with a persistent left sidebar (hidden on mobile behind a hamburger menu)
- All navigation is in the sidebar: Dashboard, Habits, Analytics, Achievements, Stats, Leaderboard, Settings, Admin
- Mobile experience uses a slide-out drawer opened by a hamburger button in the top header
- No PWA support (no manifest.json, no service worker, no install prompt)
- index.html has no PWA meta tags, no theme-color, no apple-touch-icon
- vite.config.js uses no PWA plugin

## Requested Changes (Diff)

### Add
- `public/manifest.json` — PWA web app manifest with name "HabitFlow", short_name, icons, theme_color, background_color, display: "standalone", orientation: "portrait"
- `public/icons/` — PWA icon set (192x192 and 512x512 PNG icons)
- `public/sw.js` — Service worker for offline caching of app shell assets
- PWA meta tags in `index.html`: `<link rel="manifest">`, `<meta name="theme-color">`, `<meta name="apple-mobile-web-app-capable">`, `<meta name="apple-mobile-web-app-status-bar-style">`, `<link rel="apple-touch-icon">`
- `BottomTabBar` component — fixed bottom navigation bar for mobile (≤ lg breakpoint) with 5 key tabs: Home, Habits, Analytics, Leaderboard, Settings (with active state indicator and touch-friendly tap targets ≥ 44px)
- `PWAInstallBanner` component — a dismissable "Add to Home Screen" banner that shows when `beforeinstallprompt` event fires
- `usePWAInstall` hook — listens for `beforeinstallprompt`, stores the event, exposes `isInstallable` and `promptInstall()`
- Mobile bottom padding (pb-20) on main content area when bottom tab bar is visible, so content is not hidden behind it

### Modify
- `index.html` — add PWA meta tags, manifest link, theme color
- `vite.config.js` — no plugin needed (manual SW registration)
- `App.tsx` — integrate `BottomTabBar` for mobile nav, integrate `PWAInstallBanner`, add `usePWAInstall` hook, add `pb-20 lg:pb-0` to main scroll area so content clears the bottom tab bar
- `Sidebar.tsx` — sidebar stays for desktop (lg+), no changes needed for its core nav logic; on mobile the sidebar overlay drawer remains for Admin/extra items not in bottom tab bar
- `index.css` — add `safe-area-inset-bottom` padding support for iOS home indicator via `env(safe-area-inset-bottom)`

### Remove
- Nothing removed

## Implementation Plan
1. Generate PWA icon (192x192 and 512x512) using generate_image tool
2. Create `public/manifest.json` with full PWA configuration
3. Create `public/sw.js` — service worker that pre-caches the app shell (index.html, CSS, JS) and serves from cache when offline
4. Update `index.html` with all required PWA meta tags and manifest link
5. Create `src/hooks/usePWAInstall.ts` — hook to capture `beforeinstallprompt` event and expose install trigger
6. Create `src/components/dashboard/BottomTabBar.tsx` — fixed mobile bottom nav with Home, Habits, Analytics, Leaderboard, Settings tabs
7. Create `src/components/dashboard/PWAInstallBanner.tsx` — dismissable top/bottom banner with install button
8. Update `App.tsx` to:
   - Import and render `BottomTabBar` (mobile only, passes `activeSection` + `setActiveSection`)
   - Import and render `PWAInstallBanner`
   - Add `pb-20 lg:pb-0` to main content so it doesn't hide behind bottom bar
   - Register service worker on mount
9. Update `index.css` to add `padding-bottom: env(safe-area-inset-bottom)` support for the bottom tab bar
10. Validate: typecheck, lint, build
