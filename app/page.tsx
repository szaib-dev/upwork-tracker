"use client"
import { useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import Filters from "@/components/Filters";
import ProposalTable from "@/components/ProposalTable";
import AddProposalDrawer from "@/components/AddProposalDrawer";
import DashboardStats from "@/components/analytics/DashboardStats";
import { useProposals } from "@/hooks/proposal";

// Grain background constant
const grain = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`;

export default function ProposalTracker() {
  const { session } = useAuth();
  const { proposals, updateProposal, addProposal } = useProposals();
  
  // App State
  const [filter, setFilter] = useState("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Auth Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false); // NEW: Tracks verification state

  const filtered = useMemo(() =>
    filter === "All" ? proposals : proposals.filter((p) => p.status === filter),
    [proposals, filter]
  );

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Trigger the beautiful success UI instead of a native alert
        setEmailSent(true); 
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // AUTHENTICATION UI (Shown if not logged in)
  // ══════════════════════════════════════════════════════════════════════════════
  if (!session) {
    return (
      <div style={{ background: "#080C10", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", backgroundImage: grain }}>
        
        <div style={{ 
          background: "#0E1318", 
          border: "1px solid #1E2830", 
          borderRadius: 16, 
          padding: "48px 40px", 
          width: "100%", 
          maxWidth: 420, 
          boxShadow: "0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0, 212, 255, 0.05)" 
        }}>
          
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8, textAlign: "center", color: "#E2E8F0" }}>
            Proposal<span style={{ color: "#00D4FF" }}>Tracker</span>
          </div>
          
          {emailSent ? (
            /* SUCCESS STATE UI */
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: "#00D4FF15", color: "#00D4FF", fontSize: 24, marginBottom: 20 }}>
                ✉️
              </div>
              <h3 style={{ fontSize: 18, color: "#E2E8F0", marginBottom: 12, fontWeight: 700 }}>Check your email</h3>
              <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6, fontFamily: "'DM Mono', monospace", marginBottom: 24 }}>
                We sent a verification link to <strong style={{ color: "#E2E8F0" }}>{email}</strong>. <br/><br/>
                Please click the link in that email to activate your account before logging in.
              </p>
              <button 
                onClick={() => { setEmailSent(false); setIsSignUp(false); }}
                style={{ background: "#1E2830", color: "#E2E8F0", border: "none", borderRadius: 8, padding: "12px 24px", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%", transition: "background 0.2s" }}>
                Back to Sign In
              </button>
            </div>
          ) : (
            /* LOGIN / SIGNUP FORM UI */
            <>
              <div style={{ fontSize: 13, color: "#94A3B8", textAlign: "center", marginBottom: 36, fontFamily: "'DM Mono', monospace" }}>
                {isSignUp ? "Create a new workspace" : "Sign in to your dashboard"}
              </div>

              <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#4A5568", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>Email Address</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="you@example.com"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ background: "#080C10", border: "1px solid #1E2830", borderRadius: 8, color: "#E2E8F0", fontFamily: "'DM Mono', monospace", fontSize: 14, padding: "12px 16px", width: "100%", outline: "none" }} 
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#4A5568", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>Password</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ background: "#080C10", border: "1px solid #1E2830", borderRadius: 8, color: "#E2E8F0", fontFamily: "'DM Mono', monospace", fontSize: 14, padding: "12px 16px", width: "100%", outline: "none" }} 
                  />
                </div>

                {authError && (
                  <div style={{ color: "#FF4D6A", fontSize: 12, fontFamily: "'DM Mono', monospace", background: "#FF4D6A15", padding: "10px 14px", borderRadius: 6, border: "1px solid #FF4D6A30", display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>⚠️</span> {authError}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={authLoading}
                  style={{ 
                    background: "#00D4FF", 
                    color: "#080C10", 
                    border: "none", 
                    borderRadius: 8, 
                    padding: "14px", 
                    fontFamily: "'Syne', sans-serif", 
                    fontWeight: 800, 
                    fontSize: 14, 
                    cursor: authLoading ? "default" : "pointer", 
                    marginTop: 8, 
                    opacity: authLoading ? 0.7 : 1, 
                    transition: "all 0.2s"
                  }}>
                  {authLoading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
                </button>
              </form>

              <div style={{ marginTop: 28, textAlign: "center", fontSize: 12, color: "#4A5568", fontFamily: "'DM Mono', monospace" }}>
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
                <button 
                  onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }} 
                  style={{ background: "none", border: "none", color: "#00D4FF", fontWeight: 600, cursor: "pointer", marginLeft: 8, fontFamily: "'DM Mono', monospace", textDecoration: "underline", textUnderlineOffset: 4 }}>
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MAIN DASHBOARD (Shown if logged in)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: "#080C10", minHeight: "100vh", color: "#E2E8F0", fontFamily: "'Syne', sans-serif", backgroundImage: grain }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: "1px solid #1E2830", position: "sticky", top: 0, background: "#080C10", zIndex: 50 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Proposal<span style={{ color: "#00D4FF" }}>Tracker</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: "#4A5568", fontFamily: "'DM Mono', monospace", marginRight: 8 }}>
            {session.user.email}
          </span>
          <button onClick={handleLogout} style={{ background: "transparent", color: "#4A5568", border: "1px solid #1E2830", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Logout
          </button>
          <Link href="/analytics" style={{ background: "#0E1318", color: "#94A3B8", border: "1px solid #1E2830", borderRadius: 8, padding: "8px 16px", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
            Analytics →
          </Link>
          <button onClick={() => setDrawerOpen(true)} style={{ background: "#00D4FF", color: "#080C10", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            + Add Proposal
          </button>
        </div>
      </div>

      <Filters currentFilter={filter} setFilter={setFilter} proposals={proposals} />
      
      <DashboardStats proposals={proposals} /> 

      <ProposalTable 
        filteredProposals={filtered} 
        updateProposal={updateProposal} 
      />

      {drawerOpen && (
        <AddProposalDrawer 
          closeDrawer={() => setDrawerOpen(false)} 
          addProposal={addProposal} 
        />
      )}
    </div>
  );
}