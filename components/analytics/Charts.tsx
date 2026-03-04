"use client";
import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from "recharts";

// Custom tooltip for charts
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0E1318", border: "1px solid #1E2830", borderRadius: 8, padding: "10px 14px" }}>
      {label && <div style={{ fontSize: 11, color: "#4A5568", marginBottom: 6, fontFamily: "'Syne', sans-serif" }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: 13, color: p.color || "#E2E8F0", fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" && p.name?.includes("%") ? p.value + "%" : p.value}
        </div>
      ))}
    </div>
  );
}

const Section = ({ title, children }: any) => (
  <div style={{ marginBottom: 32 }}>
    <div style={{ fontSize: 11, color: "#4A5568", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>{title}</div>
    {children}
  </div>
);

export default function Charts({ proposals }: { proposals: any[] }) {
  const stats = useMemo(() => {
    const total = proposals.length;
    const hired = proposals.filter((p: any) => p.status === "Hired").length;
    const viewed = proposals.filter((p: any) => p.viewed).length;
    const replied = proposals.filter((p: any) => ["Replied", "Interview", "Hired"].includes(p.status)).length;
    const interviews = proposals.filter((p: any) => p.status === "Interview").length;

    // Loom vs No Loom
    const loomProposals = proposals.filter((p: any) => p.loom);
    const noLoomProposals = proposals.filter((p: any) => !p.loom);

    // Boosted vs Organic
    const boostedP = proposals.filter((p: any) => p.boosted);
    const organicP = proposals.filter((p: any) => !p.boosted);

    // Monthly data
    const monthMap: any = {};
    proposals.forEach((p: any) => {
      if (!p.dateSent) return;
      const m = p.dateSent.slice(0, 7);
      if (!monthMap[m]) monthMap[m] = { month: m, total: 0, hired: 0, viewed: 0, replied: 0, connects: 0 };
      monthMap[m].total++;
      if (p.status === "Hired") monthMap[m].hired++;
      if (p.viewed) monthMap[m].viewed++;
      if (["Replied", "Interview", "Hired"].includes(p.status)) monthMap[m].replied++;
      monthMap[m].connects += p.connects || 0;
    });
    
    const monthly = Object.values(monthMap).sort((a: any, b: any) => a.month.localeCompare(b.month)).map((m: any) => ({
      ...m,
      month: m.month.slice(5) + " " + m.month.slice(2, 4),
      winRate: m.total ? Math.round((m.hired / m.total) * 100) : 0,
      viewRate: m.total ? Math.round((m.viewed / m.total) * 100) : 0,
    }));

    // Budget bucket analysis
    const buckets: any = { "< $400": { total: 0, hired: 0 }, "$400–$700": { total: 0, hired: 0 }, "$700–$1200": { total: 0, hired: 0 }, "$1200+": { total: 0, hired: 0 } };
    proposals.forEach((p: any) => {
      const b = p.budget || 0;
      const key = b < 400 ? "< $400" : b < 700 ? "$400–$700" : b < 1200 ? "$700–$1200" : "$1200+";
      buckets[key].total++;
      if (p.status === "Hired") buckets[key].hired++;
    });
    const budgetData = Object.entries(buckets).map(([range, d]: any) => ({
      range, total: d.total, hired: d.hired,
      winRate: d.total ? Math.round((d.hired / d.total) * 100) : 0,
    }));

    // Connect spend efficiency
    const connectData = [
      { label: "2–4", min: 2, max: 4 },
      { label: "5–6", min: 5, max: 6 },
      { label: "7–8", min: 7, max: 8 },
      { label: "9–10", min: 9, max: 10 },
    ].map(({ label, min, max }) => {
      const group = proposals.filter((p: any) => p.connects >= min && p.connects <= max);
      const groupHired = group.filter((p: any) => p.status === "Hired").length;
      return { label, total: group.length, hired: groupHired, winRate: group.length ? Math.round((groupHired / group.length) * 100) : 0 };
    });

    // Funnel
    const funnel = [
      { name: "Sent", value: total, fill: "#94A3B8" },
      { name: "Viewed", value: viewed, fill: "#FFD060" },
      { name: "Replied", value: replied, fill: "#B06EFF" },
      { name: "Interview", value: interviews, fill: "#00D4FF" },
      { name: "Hired", value: hired, fill: "#00E599" },
    ];

    // Client Countries
    const countryMap: any = {};
    proposals.forEach((p: any) => {
      if (!p.clientCountry) return;
      if (!countryMap[p.clientCountry]) countryMap[p.clientCountry] = { country: p.clientCountry, total: 0, hired: 0 };
      countryMap[p.clientCountry].total++;
      if (p.status === "Hired") countryMap[p.clientCountry].hired++;
    });
    const countries = Object.values(countryMap).sort((a: any, b: any) => b.total - a.total).slice(0, 6).map((c: any) => ({
      ...c, winRate: Math.round((c.hired / c.total) * 100),
    }));

    return {
      loom: { total: loomProposals.length, hired: loomProposals.filter((p: any) => p.status === "Hired").length },
      noLoom: { total: noLoomProposals.length, hired: noLoomProposals.filter((p: any) => p.status === "Hired").length },
      boosted: { total: boostedP.length, hired: boostedP.filter((p: any) => p.status === "Hired").length },
      organic: { total: organicP.length, hired: organicP.filter((p: any) => p.status === "Hired").length },
      monthly, budgetData, connectData, funnel, countries
    };
  }, [proposals]);

  const loomComparison = [
    {
      metric: "Win Rate %",
      "With Loom": stats.loom.total ? Math.round((stats.loom.hired / stats.loom.total) * 100) : 0,
      "No Loom": stats.noLoom.total ? Math.round((stats.noLoom.hired / stats.noLoom.total) * 100) : 0,
    }
  ];

  const boostedComparison = [
    {
      metric: "Win Rate %",
      "Boosted": stats.boosted.total ? Math.round((stats.boosted.hired / stats.boosted.total) * 100) : 0,
      "Organic": stats.organic.total ? Math.round((stats.organic.hired / stats.organic.total) * 100) : 0,
    }
  ];

  if (!proposals || proposals.length === 0) return null;

  return (
    <>
      <Section title="Loom vs No Loom & Boosted vs Organic">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Loom vs No Loom */}
          <div style={{ background: "#0E1318", border: "1px solid #1E2830", borderRadius: 10, padding: "20px" }}>
            <div style={{ fontSize: 12, color: "#4A5568", marginBottom: 16, fontFamily: "'DM Mono', monospace" }}>
              With Loom: <span style={{ color: "#00D4FF" }}>{stats.loom.total}</span> &nbsp;|&nbsp;
              No Loom: <span style={{ color: "#4A5568" }}>{stats.noLoom.total}</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={loomComparison} barCategoryGap="30%">
                <XAxis dataKey="metric" tick={{ fill: "#4A5568", fontSize: 11, fontFamily: "Syne" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "transparent" }} />
                <Bar dataKey="With Loom" fill="#00D4FF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="No Loom" fill="#1E2830" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Boosted vs Organic */}
          <div style={{ background: "#0E1318", border: "1px solid #1E2830", borderRadius: 10, padding: "20px" }}>
            <div style={{ fontSize: 12, color: "#4A5568", marginBottom: 16, fontFamily: "'DM Mono', monospace" }}>
              Boosted: <span style={{ color: "#FF8C42" }}>{stats.boosted.total}</span> &nbsp;|&nbsp;
              Organic: <span style={{ color: "#4A5568" }}>{stats.organic.total}</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={boostedComparison} barCategoryGap="30%">
                <XAxis dataKey="metric" tick={{ fill: "#4A5568", fontSize: 11, fontFamily: "Syne" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "transparent" }} />
                <Bar dataKey="Boosted" fill="#FF8C42" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Organic" fill="#1E2830" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      <Section title="Proposal Funnel & Monthly Volume">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 16 }}>
          {/* Funnel */}
          <div style={{ background: "#0E1318", border: "1px solid #1E2830", borderRadius: 10, padding: "20px" }}>
            {stats.funnel.map((f: any, i: number) => {
              const pct = stats.funnel[0].value ? Math.round((f.value / stats.funnel[0].value) * 100) : 0;
              return (
                <div key={f.name} style={{ marginBottom: i < stats.funnel.length - 1 ? 8 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: f.fill, fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>{f.name}</span>
                    <span style={{ fontSize: 12, color: "#E2E8F0", fontFamily: "'DM Mono', monospace" }}>{f.value} <span style={{ color: "#4A5568" }}>({pct}%)</span></span>
                  </div>
                  <div style={{ background: "#1E2830", borderRadius: 3, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: f.fill, borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Monthly line chart */}
          <div style={{ background: "#0E1318", border: "1px solid #1E2830", borderRadius: 10, padding: "20px" }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={stats.monthly}>
                <XAxis dataKey="month" tick={{ fill: "#4A5568", fontSize: 11, fontFamily: "Syne" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="total" stroke="#00D4FF" strokeWidth={2} dot={{ fill: "#00D4FF", r: 3 }} name="Sent" />
                <Line type="monotone" dataKey="hired" stroke="#00E599" strokeWidth={2} dot={{ fill: "#00E599", r: 3 }} name="Hired" />
                <Line type="monotone" dataKey="replied" stroke="#B06EFF" strokeWidth={2} dot={{ fill: "#B06EFF", r: 3 }} strokeDasharray="4 2" name="Replied" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      <Section title="Budget Range & Connect Spend Analysis">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Win Rate by Budget */}
          <div style={{ background: "#0E1318", border: "1px solid #1E2830", borderRadius: 10, padding: "20px" }}>
            <div style={{ fontSize: 11, color: "#4A5568", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16, fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Win Rate by Budget Range</div>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={stats.budgetData} barCategoryGap="25%">
                <XAxis dataKey="range" tick={{ fill: "#4A5568", fontSize: 10, fontFamily: "Syne" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "transparent" }} />
                <Bar dataKey="winRate" name="Win Rate %" radius={[4, 4, 0, 0]}>
                  {stats.budgetData.map((d: any, i: number) => (
                    <Cell key={i} fill={d.winRate > 40 ? "#00E599" : d.winRate > 20 ? "#FFD060" : "#FF4D6A"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Win Rate by Connects */}
          <div style={{ background: "#0E1318", border: "1px solid #1E2830", borderRadius: 10, padding: "20px" }}>
            <div style={{ fontSize: 11, color: "#4A5568", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16, fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Win Rate by Connects Used</div>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={stats.connectData} barCategoryGap="25%">
                <XAxis dataKey="label" tick={{ fill: "#4A5568", fontSize: 11, fontFamily: "Syne" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4A5568", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "transparent" }} />
                <Bar dataKey="winRate" name="Win Rate %" radius={[4, 4, 0, 0]} fill="#00D4FF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>
    </>
  );
}