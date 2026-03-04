"use client"
import Link from "next/link";
import DashboardStats from "@/components/analytics/DashboardStats";
import Insights from "@/components/analytics/Insights";
import Charts from "@/components/analytics/Charts";
import { useProposals } from "@/hooks/proposal";

const grain = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`;

export default function AnalyticsDashboard() {
  const { proposals } = useProposals();

  return (
    <div style={{ background: "#080C10", minHeight: "100vh", color: "#E2E8F0", fontFamily: "'Syne', sans-serif", backgroundImage: grain }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: "1px solid #1E2830", position: "sticky", top: 0, background: "#080C10", zIndex: 50 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Proposal<span style={{ color: "#00D4FF" }}>Tracker</span>
          <span style={{ color: "#2A3440", margin: "0 10px" }}>/</span>
          <span style={{ color: "#4A5568", fontSize: 14, fontWeight: 600 }}>Analytics</span>
        </div>
        <Link href="/" style={{ background: "#1E2830", color: "#94A3B8", textDecoration: "none", borderRadius: 7, padding: "8px 16px", fontSize: 12, fontWeight: 600 }}>
          ← Back to Tracker
        </Link>
      </div>

      <div style={{ padding: "28px" }}>
        {/* Pass proposals down and let components handle their specific useMemo data processing */}
        <DashboardStats proposals={proposals} />
        <Insights proposals={proposals} />
        <Charts proposals={proposals} />
      </div>
    </div>
  );
}