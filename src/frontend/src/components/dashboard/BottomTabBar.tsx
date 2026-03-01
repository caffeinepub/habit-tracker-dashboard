import {
  BarChart3,
  LayoutDashboard,
  ListChecks,
  Settings,
  Trophy,
} from "lucide-react";
import { motion } from "motion/react";

interface BottomTabBarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
}

const TABS = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "habits", label: "Habits", icon: ListChecks },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "leaderboard", label: "Leaders", icon: Trophy },
  { id: "settings", label: "Settings", icon: Settings },
];

// Which section IDs count as "active" for each tab
const TAB_ACTIVE_SECTIONS: Record<string, string[]> = {
  dashboard: ["dashboard", "habits", "analytics"],
  habits: ["habits"],
  analytics: ["analytics"],
  leaderboard: ["leaderboard"],
  settings: ["settings"],
};

export function BottomTabBar({
  activeSection,
  onSectionChange,
}: BottomTabBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main navigation"
    >
      {/* Blur backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: "oklch(var(--background) / 0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderTop: "1px solid oklch(var(--border))",
        }}
      />

      {/* Tab items */}
      <div className="relative flex items-stretch justify-around px-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const activeSections = TAB_ACTIVE_SECTIONS[tab.id] ?? [tab.id];
          const isActive = activeSections.includes(activeSection);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSectionChange(tab.id)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5 min-h-[56px] relative"
              style={{ touchAction: "manipulation" }}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active background pill */}
              {isActive && (
                <motion.div
                  layoutId="bottom-tab-active"
                  className="absolute inset-x-1 inset-y-1 rounded-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.62 0.22 290 / 0.18), oklch(0.55 0.2 310 / 0.12))",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}

              <div className="relative">
                <Icon
                  size={22}
                  className={
                    isActive
                      ? "text-primary transition-colors"
                      : "text-muted-foreground transition-colors"
                  }
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
                {/* Active dot indicator */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                  />
                )}
              </div>

              <span
                className={`text-[10px] font-medium leading-none relative ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
