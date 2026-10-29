"use client";

import { useTheme } from "@/lib/theme";
import { MoonIcon, SunIcon } from "@/components/layout/icons";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  function toggleTheme(): void {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  }


  return (
    <button
      type="button"
      aria-label="Alternar tema"
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <MoonIcon className="block h-[1.2rem] w-[1.2rem] dark:hidden" />
      <SunIcon className="hidden h-[1.2rem] w-[1.2rem] dark:block" />
    </button>
  );
}