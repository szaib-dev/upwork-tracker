"use client";
import { useState } from "react";
import Link from "next/link";
import { FaBars, FaBell, FaChartLine, FaMoon, FaPlus, FaRegCalendarAlt, FaSun, FaTimes, FaUsers } from "react-icons/fa";
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
            <Link href="/" style={{ fontSize: 20, fontWeight: 800, textDecoration: "none" }} className="brand-link">Proposal<span style={{ color: "var(--primary)" }}>Tracker</span></Link>
            {userEmail && (
              <div className="xs-email" style={{ marginTop: 4, fontSize: 11, color: "var(--muted)", border: "1px solid var(--border)", borderRadius: 999, padding: "2px 8px", width: "fit-content", maxWidth: "52vw", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userEmail}
              </div>
            )}
          </div>

          <div style={{ display: "none", gap: 8, alignItems: "center" }} className="desktop-nav">
            <Link href="/analytics" style={topBtn} className="top-btn">Analytics</Link>
            <Link href="/progress" style={topBtn} className="top-btn">Months</Link>
            <Link href="/clients" style={topBtn} className="top-btn">Clients</Link>
            <Link href="/follow-up" style={topBtn} className="top-btn">Follow Up</Link>
            {session?.user?.id && <HeaderShareButton userId={session.user.id} className="top-btn" />}
            <button onClick={toggleTheme} aria-label="Toggle theme" style={topBtn} className="top-btn">
              {theme === "dark" ? <FaSun /> : <FaMoon />}
            </button>
            {onAddProposal && <button onClick={onAddProposal} style={{ ...topBtn, background: "var(--primary)", color: "#03131d", border: "1px solid color-mix(in srgb, var(--primary) 70%, var(--border))", fontWeight: 700 }} className="top-btn">+ Add</button>}
            <button onClick={() => void handleLogout()} style={topBtn} className="top-btn">Logout</button>
          </div>

          <div className="mobile-actions" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {session?.user?.id && <HeaderShareButton userId={session.user.id} className="mobile-icon-btn top-btn" />}
            {onAddProposal && (
              <button onClick={onAddProposal} style={mobileBtn} className="mobile-icon-btn top-btn" aria-label="Add proposal" title="Add proposal">
                <FaPlus />
              </button>
            )}
            <button onClick={() => setMenuOpen(true)} style={mobileBtn} className="mobile-menu-btn mobile-icon-btn top-btn" aria-label="Menu">
              <FaBars />
            </button>
          </div>
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
            <Link href="/analytics" style={sideLink} className="side-link" onClick={() => setMenuOpen(false)}><FaChartLine /> Analytics</Link>
            <Link href="/progress" style={sideLink} className="side-link" onClick={() => setMenuOpen(false)}><FaRegCalendarAlt /> Months</Link>
            <Link href="/clients" style={sideLink} className="side-link" onClick={() => setMenuOpen(false)}><FaUsers /> Clients</Link>
            <Link href="/follow-up" style={sideLink} className="side-link" onClick={() => setMenuOpen(false)}><FaBell /> Follow Up</Link>
            <button onClick={() => { toggleTheme(); setMenuOpen(false); }} style={sideBtn} className="side-btn">{theme === "dark" ? "Light Mode" : "Dark Mode"}</button>
            <button onClick={() => void handleLogout()} style={sideBtn} className="side-btn">Logout</button>
          </div>
        </div>
      )}

      <style>{`
        .xs-email { display: none; }
        .top-btn:hover {
          background: color-mix(in srgb, var(--bg-elev) 80%, var(--primary) 20%);
          border-color: color-mix(in srgb, var(--border) 65%, var(--primary) 35%);
          transform: translateY(-1px);
        }
        .side-link,
        .side-btn {
          transition: background-color 0.16s ease, border-color 0.16s ease, transform 0.16s ease;
        }
        .side-link:hover,
        .side-btn:hover {
          background: color-mix(in srgb, var(--bg-elev) 74%, var(--primary-soft) 26%);
          border-color: color-mix(in srgb, var(--border) 60%, var(--primary) 40%);
          transform: translateX(-1px);
        }
        .brand-link { font-size: 20px; }
        @media (min-width: 901px) {
          .desktop-nav { display: inline-flex !important; }
          .mobile-menu-btn { display: none !important; }
          .mobile-actions { display: none !important; }
          .xs-email { display: inline-flex !important; }
        }
        @media (max-width: 900px) {
          .brand-link { font-size: 16px !important; }
          .mobile-icon-btn { width: 34px !important; height: 34px !important; padding: 0 !important; font-size: 14px !important; }
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
  transition: "background-color 0.16s ease, border-color 0.16s ease, transform 0.16s ease",
};

const sideLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
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

const mobileBtn: React.CSSProperties = {
  ...topBtn,
  width: 34,
  height: 34,
  padding: 0,
  fontSize: 14,
};
