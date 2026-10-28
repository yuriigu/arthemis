"use client";

import { useCallback, useEffect, useState } from "react";

const THEME_STORAGE_KEY = "arthemis_theme";
const DARK_CLASS = "dark";

export type Theme = "light" | "dark" | "system";

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    // localStorage indisponível ou bloqueado
  }
  return null;
}

function resolveTheme(stored: Theme | null): Theme {
  if (stored) return stored;
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

function applyThemeToDocument(theme: Theme): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  if (resolved === "dark") {
    html.classList.add(DARK_CLASS);
  } else {
    html.classList.remove(DARK_CLASS);
  }
}

/**
 * Hook de tema com persistência em `localStorage`.
 * Somente preferência visual — nunca armazena JWT ou dados de sessão.
 *
 * A estratégia evita FOUC de duas formas:
 * 1. O root layout injeta um script inline no <head> que aplica a classe `.dark`
 *    antes da hidratação do React.
 * 2. O estado inicial do hook usa um lazy initializer que lê o localStorage
 *    no cliente, evitando setState dentro de effect (sem cascading renders).
 */
export function useTheme(defaultTheme: Theme = "system"): {
  theme: Theme;
  setTheme: (theme: Theme) => void;
} {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    const stored = getStoredTheme();
    return resolveTheme(stored ?? defaultTheme);
  });

  // Aplica a classe .dark no documento sempre que o tema muda (sem setState).
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: Theme): void => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // localStorage indisponível: ignora silenciosamente
    }
  }, []);

  return { theme, setTheme };
}

/**
 * Aplica o tema armazenado no `document.documentElement` antes da hidratação do React.
 * Destinado a ser chamado em um script inline no `<head>` (root layout).
 */
export function applyStoredThemeImmediately(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const stored = getStoredTheme();
  applyThemeToDocument(resolveTheme(stored));
}