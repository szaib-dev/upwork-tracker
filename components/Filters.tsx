import React from "react";
import { Proposal } from "@/lib/types/proposal";

export const STATUSES: Proposal["status"][] = ["Sent", "Viewed", "Replied", "Interview", "Hired", "Rejected"];

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Sent: { bg: "#2a3644", text: "#a9bccf", dot: "#9eb2c6" },
  Viewed: { bg: "#2d2a14", text: "#ffdd66", dot: "#ffd247" },
  Replied: { bg: "#2d1f3a", text: "#c896ff", dot: "#b87aff" },
  Interview: { bg: "#153429", text: "#57eba9", dot: "#2ddf93" },
  Hired: { bg: "#0f3c2f", text: "#4bf3a5", dot: "#26d88c" },
  Rejected: { bg: "#3b1e2a", text: "#ff8aa4", dot: "#ff6f91" },
};

type FiltersProps = {
  currentFilter: "All" | Proposal["status"];
  setFilter: (status: "All" | Proposal["status"]) => void;
  proposals: Proposal[];
};

export default function Filters({ currentFilter, setFilter, proposals }: FiltersProps) {
  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--bg-soft)", borderRadius: 14, padding: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["All", ...STATUSES] as const).map((s) => {
          const active = currentFilter === s;
          const c = s === "All" ? "var(--primary)" : STATUS_COLORS[s].dot;
          const count = s === "All" ? proposals.length : proposals.filter((p) => p.status === s).length;

          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                background: active ? (s === "All" ? "var(--primary-soft)" : STATUS_COLORS[s].bg) : "transparent",
                color: active ? c : "var(--muted)",
                border: `1px solid ${active ? c : "var(--border)"}`,
                borderRadius: 18,
                padding: "6px 12px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {s} <span style={{ fontFamily: "monospace" }}>{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
