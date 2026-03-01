import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "flex items-center gap-2 rounded-lg transition-all duration-200",
        "text-muted-foreground hover:text-foreground",
        "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        showLabel ? "px-3 py-2 text-sm font-medium" : "w-8 h-8 justify-center",
        className,
      )}
    >
      {isDark ? (
        <Sun size={16} className="shrink-0" />
      ) : (
        <Moon size={16} className="shrink-0" />
      )}
      {showLabel && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
