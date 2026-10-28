"use client";

import { useSyncExternalStore } from "react";

import { useTheme } from "@/lib/theme";
import { MoonIcon, SunIcon } from "@/components/layout/icons";

const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Carregando tema"
        disabled
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground opacity-50 shadow-sm"
      >
        <MoonIcon className="h-[1.2rem] w-[1.2rem]" />
      </button>
    );
  }

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      type="button"
      aria-label={`Alternar para ${isDark ? "tema claro" : "tema escuro"}`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      aria-pressed={isDark}
    >
      {isDark ? (
        <SunIcon className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <MoonIcon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">{theme}</span>
    </button>
  );
}