import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const resolved = theme === "system" ? getSystemTheme() : theme;
  if (resolved === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem("habitflow-theme") as Theme | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }
    } catch {
      // ignore
    }
    return "dark";
  });

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system preference changes when theme is "system"
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem("habitflow-theme", newTheme);
    } catch {
      // ignore
    }
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const resolved = prev === "system" ? getSystemTheme() : prev;
      const next: Theme = resolved === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("habitflow-theme", next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? getSystemTheme() : theme;

  return { theme, resolvedTheme, setTheme, toggleTheme };
}
