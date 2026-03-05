"use client";
import { useState } from "react";
import Link from "next/link";
import { FaBars, FaMoon, FaSun, FaTimes } from "react-icons/fa";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import HeaderShareButton from "@/components/HeaderShareButton";
import { useToast } from "@/components/ui/ToastProvider";

export default function AppHeader({ onAddProposal }: { onAddProposal?: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { session } = useAuth();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const userEmail = session?.user?.email || "";

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast(error.message || "Logout failed.", "error");
      return;
    }
    toast("Logged out.", "success");
    setMenuOpen(false);
  };

  return (
    <>
      <header style={{ position: "sticky", top: 0, zIndex: 70, borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg) 92%, transparent)", backdropFilter: "blur(6px)", padding: "10px 12px" }}>
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <Link href="/" style={{ fontSize: 20, fontWeight: 800, textDecoration: "none" }}>Proposal<span style={{ color: "var(--primary)" }}>Tracker</span></Link>
            {userEmail && (
              <div className="xs-email" style={{ marginTop: 4, fontSize: 11, color: "var(--muted)", border: "1px solid var(--border)", borderRadius: 999, padding: "2px 8px", width: "fit-content", maxWidth: "52vw", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userEmail}
              </div>
            )}
          </div>

          <div style={{ display: "none", gap: 8, alignItems: "center" }} className="desktop-nav">
            <Link href="/analytics" style={topBtn}>Analytics</Link>
            <Link href="/progress" style={topBtn}>Months</Link>
            <Link href="/clients" style={topBtn}>Clients</Link>
            <Link href="/follow-up" style={topBtn}>Follow Up</Link>
            {session?.user?.id && <HeaderShareButton userId={session.user.id} />}
            <button onClick={toggleTheme} aria-label="Toggle theme" style={topBtn}>
              {theme === "dark" ? <FaSun /> : <FaMoon />}
            </button>
            {onAddProposal && <button onClick={onAddProposal} style={{ ...topBtn, background: "var(--primary)", color: "#03131d", border: "1px solid color-mix(in srgb, var(--primary) 70%, var(--border))", fontWeight: 700 }}>+ Add</button>}
            <button onClick={() => void handleLogout()} style={topBtn}>Logout</button>
          </div>

          <button onClick={() => setMenuOpen(true)} style={topBtn} className="mobile-menu-btn">
            <FaBars />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 120 }}>
          <div onClick={() => setMenuOpen(false)} style={{ position: "absolute", inset: 0, background: "#00000066" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 280, background: "var(--bg-soft)", borderLeft: "1px solid var(--border)", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <strong>Menu</strong>
              <button onClick={() => setMenuOpen(false)} style={topBtn}><FaTimes /></button>
            </div>
            <Link href="/analytics" style={sideLink} onClick={() => setMenuOpen(false)}>Analytics</Link>
            <Link href="/progress" style={sideLink} onClick={() => setMenuOpen(false)}>Months</Link>
            <Link href="/clients" style={sideLink} onClick={() => setMenuOpen(false)}>Clients</Link>
            <Link href="/follow-up" style={sideLink} onClick={() => setMenuOpen(false)}>Follow Up</Link>
            {session?.user?.id && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <HeaderShareButton userId={session.user.id} />
              </div>
            )}
            <button onClick={() => { toggleTheme(); setMenuOpen(false); }} style={sideBtn}>{theme === "dark" ? "Light Mode" : "Dark Mode"}</button>
            {onAddProposal && <button onClick={() => { onAddProposal(); setMenuOpen(false); }} style={sideBtn}>+ Add Proposal</button>}
            <button onClick={() => void handleLogout()} style={sideBtn}>Logout</button>
          </div>
        </div>
      )}

      <style>{`
        .xs-email { display: inline-flex; }
        @media (min-width: 901px) {
          .desktop-nav { display: inline-flex !important; }
          .mobile-menu-btn { display: none !important; }
          .xs-email { display: none !important; }
        }
      `}</style>
    </>
  );
}

const topBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: 9,
  padding: "7px 10px",
  fontSize: 12,
  textDecoration: "none",
  cursor: "pointer",
};

const sideLink: React.CSSProperties = {
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: 8,
  padding: "9px 10px",
  textDecoration: "none",
  fontSize: 13,
};

const sideBtn: React.CSSProperties = {
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: 8,
  padding: "9px 10px",
  textAlign: "left",
  cursor: "pointer",
};
