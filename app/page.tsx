"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import AppHeader from "@/components/AppHeader";
import Filters from "@/components/Filters";
import ProposalTable from "@/components/ProposalTable";
import AddProposalDrawer from "@/components/AddProposalDrawer";
import DashboardStats from "@/components/analytics/DashboardStats";
import MonthDropdown from "@/components/MonthDropdown";
import { useProposals } from "@/hooks/proposal";
import { Proposal } from "@/lib/types/proposal";

type FilterType = "All" | Proposal["status"];

function formatMonthLabel(month: string) {
  return new Date(`${month}-01`).toLocaleString("en-US", { month: "short", year: "numeric" });
}

function buildCountdown(target: Date, nowTs: number) {
  const diff = target.getTime() - nowTs;
  if (diff <= 0) return "Due now";
  const mins = Math.floor(diff / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h`;
  return `${h}h ${m}m`;
}

export default function ProposalTracker() {
  const { session } = useAuth();
  const { proposals, loading, updateProposal, addProposal, deleteProposal } = useProposals(session?.user?.id);

  const [filter, setFilter] = useState<FilterType>("All");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const monthOptions = useMemo(
    () => Array.from(new Set(proposals.map((p) => p.dateSent.slice(0, 7)).filter(Boolean))).sort((a, b) => b.localeCompare(a)),
    [proposals],
  );
  const monthSelectOptions = useMemo(
    () => [{ value: "all", label: "All months" }, ...monthOptions.map((m) => ({ value: m, label: formatMonthLabel(m) }))],
    [monthOptions],
  );

  const filtered = useMemo(() => {
    return proposals.filter((p) => {
      const statusMatch = filter === "All" || p.status === filter;
      const monthMatch = monthFilter === "all" || p.dateSent.startsWith(monthFilter);
      return statusMatch && monthMatch;
    });
  }, [proposals, filter, monthFilter]);

  const nextFollowUp = useMemo(() => {
    const upcoming = proposals
      .filter((p) => p.followUpAt)
      .map((p) => ({ p, dt: new Date(p.followUpAt) }))
      .filter((x) => x.dt.getTime() > nowTs)
      .sort((a, b) => a.dt.getTime() - b.dt.getTime());
    return upcoming[0] ?? null;
  }, [proposals, nowTs]);

  const showFollowUpBanner = !!nextFollowUp && nextFollowUp.dt.getTime() - nowTs <= 24 * 60 * 60 * 1000;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="max-w-[1300px] w-full mx-auto" style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "radial-gradient(circle at 15% 10%, color-mix(in srgb, var(--primary) 16%, var(--bg)) 0%, var(--bg) 42%)", padding: 16 }}>
        <div style={{ width: "100%", maxWidth: 1040, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, alignItems: "center", background: "var(--bg-soft)", border: "1px solid var(--border)", borderRadius: 20, padding: 20 }}>
          <div style={{ padding: 8 }}>
            <h1 style={{ margin: 0, fontSize: "clamp(34px, 5vw, 64px)", lineHeight: 1.04 }}>Track proposals like a pro.</h1>
            <p style={{ marginTop: 14, color: "var(--muted)", lineHeight: 1.7, maxWidth: 620 }}>
              Built for freelancers who need a fast dashboard for proposals, follow-ups, analytics, and client tracking.
            </p>
          </div>

          <div style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
            <div style={{ textAlign: "center", fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Proposal<span style={{ color: "var(--primary)" }}>Tracker</span></div>
            <form onSubmit={handleAuth} style={{ display: "grid", gap: 10 }}>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@example.com" style={authInput} />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="Password" style={authInput} />
              {authError && <div style={{ color: "var(--danger)", fontSize: 12 }}>{authError}</div>}
              <button type="submit" disabled={authLoading} style={primaryBtn}>{authLoading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}</button>
              <button type="button" onClick={() => setIsSignUp((x) => !x)} style={ghostBtn}>{isSignUp ? "Have an account? Sign In" : "Create new account"}</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <AppHeader onAddProposal={() => setDrawerOpen(true)} />

      <main style={{ width: "100%", padding: "14px 14px 26px", minWidth: 0 }}>
        <section style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10, padding: "2px 2px 0" }}>
          <div>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "0.01em" }}>Home Dashboard</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{filtered.length} proposals in current view</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.09em" }}>Month</div>
            <MonthDropdown value={monthFilter} onChange={setMonthFilter} options={monthSelectOptions} width={240} />
          </div>
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          {showFollowUpBanner && nextFollowUp && (
            <section style={{ background: "var(--primary-soft)", border: "1px solid color-mix(in srgb, var(--primary) 55%, var(--border))", color: "var(--text)", borderRadius: 12, padding: "11px 12px", fontSize: 13 }}>
              Next follow-up in <strong>{buildCountdown(nextFollowUp.dt, nowTs)}</strong>: <strong>{nextFollowUp.p.jobTitle || "Untitled"}</strong>
            </section>
          )}

          <div style={{ minWidth: 0 }}>
            <Filters currentFilter={filter} setFilter={setFilter} proposals={proposals} />
          </div>
          <div style={{ minWidth: 0 }}>
            <DashboardStats proposals={filtered} />
          </div>

          {loading ? (
            <div style={{ background: "var(--bg-soft)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px", color: "var(--muted)" }}>Loading proposals...</div>
          ) : (
            <div style={{ minWidth: 0 }}>
              <ProposalTable filteredProposals={filtered} updateProposal={updateProposal} deleteProposal={deleteProposal} />
            </div>
          )}
        </div>
      </main>

      {drawerOpen && <AddProposalDrawer closeDrawer={() => setDrawerOpen(false)} addProposal={addProposal} />}
    </div>
  );
}

const authInput: React.CSSProperties = {
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  borderRadius: 9,
  color: "var(--text)",
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
};

const primaryBtn: React.CSSProperties = {
  background: "var(--primary)",
  color: "#04141f",
  border: "none",
  borderRadius: 9,
  padding: "10px",
  fontWeight: 700,
  cursor: "pointer",
};

const ghostBtn: React.CSSProperties = {
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  borderRadius: 9,
  padding: "9px",
  color: "var(--muted)",
  cursor: "pointer",
};
