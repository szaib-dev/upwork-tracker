import React, { useMemo } from "react";

function StatCard({ label, value, color, sub }: any) {
  return (
    <div style={{ background: "#0E1318", border: "1px solid #1E2830", borderRadius: 10, padding: "14px 20px", flex: 1, minWidth: 100 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#2A3440", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{sub}</div>}
      <div style={{ fontSize: 11, color: "#4A5568", fontFamily: "'Syne', sans-serif", marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

export default function DashboardStats({ proposals }: any) {
  const stats = useMemo(() => {
    const total = proposals.length;
    const hired = proposals.filter((p: any) => p.status === "Hired").length;
    const viewed = proposals.filter((p: any) => p.viewed).length;
    const replied = proposals.filter((p: any) => ["Replied", "Interview", "Hired"].includes(p.status)).length;
    const connects = proposals.reduce((a: number, p: any) => a + (p.connects || 0), 0);
    const totalBudget = proposals.filter((p: any) => p.status === "Hired").reduce((a: number, p: any) => a + (p.budget || 0), 0);
    
    return {
      total, hired, connects, totalBudget,
      winRate: total ? Math.round((hired / total) * 100) : 0,
      viewRate: total ? Math.round((viewed / total) * 100) : 0,
      replyRate: total ? Math.round((replied / total) * 100) : 0,
      costPerHire: hired ? Math.round(connects / hired) : 0,
      avgBudget: hired ? Math.round(totalBudget / hired) : 0,
    };
  }, [proposals]);

  return (
    <div style={{ marginBottom: 32, padding: "16px 28px" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <StatCard label="Total" value={stats.total} color="#E2E8F0" />
        <StatCard label="Hired" value={stats.hired} color="#00E599" sub={`$${stats.totalBudget.toLocaleString()} earned`} />
        <StatCard label="Win Rate" value={`${stats.winRate}%`} color="#00E599" />
        <StatCard label="View Rate" value={`${stats.viewRate}%`} color="#FFD060" />
        <StatCard label="Reply Rate" value={`${stats.replyRate}%`} color="#B06EFF" />
        <StatCard label="Connects Used" value={stats.connects} color="#00D4FF" sub={`${stats.costPerHire} per hire`} />
        <StatCard label="Avg Job Budget" value={`$${stats.avgBudget}`} color="#FF8C42" />
      </div>
    </div>
  );
}