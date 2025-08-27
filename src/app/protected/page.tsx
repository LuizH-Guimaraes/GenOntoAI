// app/protected/page.tsx ou app/protected/dashboard/page.tsx
"use client";

import { useSession } from "@/app/context/SessionContext";
import { DashBoardPage } from "./dashboard";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login?returnTo=/protected");
    }
  }, [user, loading, router]);

  if (loading) return <p>Loading...</p>;

  if (!user) return null; // Ou mensagem temporária

  return <DashBoardPage user={user} />;
}
