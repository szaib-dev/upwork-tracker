import React, { useState } from "react";
import ProposalRow from "./ProposalRow";

export default function ProposalTable({ filteredProposals, updateProposal }: any) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div style={{ padding: "0 28px 40px", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #1E2830" }}>
            {["Date", "Job Title", "Status", "Budget", "Connects", "Boost", "Loom", "Viewed", "Lead", "Country"].map(h => (
              <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, color: "#4A5568", fontFamily: "'Syne', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, whiteSpace: "nowrap", background: "#080C10" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredProposals.map((p: any) => (
            <ProposalRow 
              key={p.id} 
              p={p} 
              isExpanded={expandedId === p.id} 
              onToggleExpand={() => setExpandedId(expandedId === p.id ? null : p.id)}
              updateProposal={updateProposal} 
            />
          ))}
        </tbody>
      </table>

      {filteredProposals.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#2A3440", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
          No proposals found.
        </div>
      )}
    </div>
  );
}