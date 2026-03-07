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
		let active = true;

		void supabase.auth
			.getSession()
			.then(({ data: { session: activeSession }, error }) => {
				if (!active) return;
				if (error) {
					setSession(null);
				} else {
					setSession(activeSession);
				}
				setLoading(false);
			})
			.catch(() => {
				if (!active) return;
				setSession(null);
				setLoading(false);
			});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, activeSession) => {
			if (!active) return;
			setSession(activeSession);
			if (event === "INITIAL_SESSION") setLoading(false);
		});

		return () => {
			active = false;
			subscription.unsubscribe();
		};
	}, []);

	if (loading) {
		return (
			<div
				style={{
					background: "var(--bg)",
					height: "100vh",
					color: "var(--primary)",
					display: "grid",
					placeItems: "center",
					fontFamily: "monospace",
				}}
			>
				Authenticating...
			</div>
		);
	}

	return (
		<AuthContext.Provider value={{ session }}>{children}</AuthContext.Provider>
	);
}

export const useAuth = () => useContext(AuthContext);
