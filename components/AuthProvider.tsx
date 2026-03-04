"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the active session when the app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for login/logout events in real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ background: "#080C10", height: "100vh", color: "#00D4FF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace" }}>Authenticating...</div>;
  }

  return (
    <AuthContext.Provider value={{ session }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);