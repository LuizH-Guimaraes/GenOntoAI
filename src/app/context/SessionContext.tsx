// app/context/SessionContext.tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@auth0/nextjs-auth0/types";

type SessionContextType = {
  user: User | null;
  loading: boolean;
};

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session") // endpoint para pegar o usuário
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user || null);
        setLoading(false);
      });
  }, []);

  return (
    <SessionContext.Provider value={{ user, loading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
