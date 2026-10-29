"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { api, ApiError, setUnauthorizedHandler } from "@/lib/api";
import {
  LOGIN_PATH,
  normalizeAuthUser,
  type AuthLoginResponse,
  type AuthUser,
  type AuthUserPayload,
  type LoginCredentials,
} from "@/lib/auth/constants";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const logoutInProgress = useRef(false);

  useEffect(() => {
    let isMounted = true;

    void api
      .get<AuthUserPayload>("/auth/me", { credentials: "include" })
      .then((payload) => {
        if (isMounted) setUser(normalizeAuthUser(payload));
      })
      .catch(async (error: unknown) => {
        if (!isMounted) return;

        if (error instanceof ApiError && error.status === 401) {
          await api
            .post<{ success: true }>("/auth/logout", { credentials: "include" })
            .catch(() => undefined);
        }
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthUser> => {
      await api.post<AuthLoginResponse>("/auth/login", {
        body: credentials,
        token: null,
        credentials: "include",
      });

      const payload = await api.get<AuthUserPayload>("/auth/me", {
        credentials: "include",
      });
      const authenticatedUser = normalizeAuthUser(payload);
      setUser(authenticatedUser);
      return authenticatedUser;
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    if (logoutInProgress.current) return;
    logoutInProgress.current = true;

    try {
      await api.post<{ success: true }>("/auth/logout", {
        credentials: "include",
      });
    } finally {
      setUser(null);
      logoutInProgress.current = false;
      router.replace(LOGIN_PATH);
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (user !== null) {
        void logout().catch((error: unknown) => {
          console.error("Falha ao encerrar a sessão após resposta 401.", error);
        });
      }
    });

    return () => setUnauthorizedHandler(null);
  }, [logout, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [isLoading, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
