"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  session: Session | null;
};

const AuthContext = createContext<AuthContextValue>({ session: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      setSession(activeSession);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      setSession(activeSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ background: "var(--bg)", height: "100vh", color: "var(--primary)", display: "grid", placeItems: "center", fontFamily: "monospace" }}>
        Authenticating...
      </div>
    );
  }

  return <AuthContext.Provider value={{ session }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
