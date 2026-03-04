import React from "react";

export const STATUSES = ["Sent", "Viewed", "Replied", "Interview", "Hired", "Rejected"];
export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Sent: { bg: "#1E2830", text: "#94A3B8", dot: "#94A3B8" },
  Viewed: { bg: "#2A2200", text: "#FFD060", dot: "#FFD060" },
  Replied: { bg: "#1E1030", text: "#B06EFF", dot: "#B06EFF" },
  Interview: { bg: "#002A20", text: "#00E599", dot: "#00E599" },
  Hired: { bg: "#002A20", text: "#00E599", dot: "#00E599" },
  Rejected: { bg: "#2A0010", text: "#FF4D6A", dot: "#FF4D6A" },
};

export default function Filters({ currentFilter, setFilter, proposals }: any) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "16px 28px 0", flexWrap: "wrap" }}>
      {["All", ...STATUSES].map((s) => {
        const active = currentFilter === s;
        const c = s === "All" ? "#00D4FF" : STATUS_COLORS[s]?.dot || "#94A3B8";
        const count = s === "All" ? proposals.length : proposals.filter((p: any) => p.status === s).length;
        
        return (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              background: active ? (s === "All" ? "#00D4FF20" : STATUS_COLORS[s]?.bg) : "transparent",
              color: active ? c : "#4A5568",
              border: `1px solid ${active ? c + "50" : "#1E2830"}`,
              borderRadius: 20, padding: "5px 14px", fontSize: 12,
              fontFamily: "'Syne', sans-serif", fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {s} <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}