// src/app/context/SessionContext.tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@auth0/nextjs-auth0/types";

type SessionContextType = {
  user: User | null;
  loading: boolean;
  refresh: () => void;
};

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
  refresh: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bump, setBump] = useState(0); // para permitir refresh

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/session", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal: ac.signal,
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const data = await res.json().catch(() => ({}));
          setUser((data as any).user ?? null);
        } else {
          // resposta sem JSON (ex.: 204) -> assume usuário nulo
          setUser(null);
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") setUser(null);
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [bump]);

  const refresh = () => setBump((n) => n + 1);

  const value = useMemo(() => ({ user, loading, refresh }), [user, loading]);
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
