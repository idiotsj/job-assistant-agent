"use client";

import type { AuthUser } from "@job-assistant/contracts/auth";
import { createContext, startTransition, useContext, useEffect, useEffectEvent, useState, type ReactNode } from "react";

import { getCurrentUser, logout } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  error: ApiError | null;
  refreshSession: () => Promise<void>;
  markLoggedIn: (user: AuthUser) => void;
  logoutSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<ApiError | null>(null);

  const refreshSession = useEffectEvent(async () => {
    startTransition(() => {
      setStatus("loading");
    });

    try {
      const currentUser = await getCurrentUser();

      startTransition(() => {
        setUser(currentUser);
        setStatus("authenticated");
        setError(null);
      });
    } catch (caughtError) {
      const apiError = caughtError instanceof ApiError ? caughtError : null;

      startTransition(() => {
        setUser(null);
        setStatus("unauthenticated");
        setError(apiError);
      });
    }
  });

  useEffect(() => {
    void refreshSession();
  }, []);

  function markLoggedIn(nextUser: AuthUser) {
    startTransition(() => {
      setUser(nextUser);
      setStatus("authenticated");
      setError(null);
    });
  }

  async function logoutSession() {
    try {
      await logout();
    } catch {
      // Keep local logout resilient even if backend session cleanup fails.
    }

    startTransition(() => {
      setUser(null);
      setStatus("unauthenticated");
      setError(null);
    });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        error,
        refreshSession,
        markLoggedIn,
        logoutSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthSession must be used within AuthProvider");
  }

  return context;
}
