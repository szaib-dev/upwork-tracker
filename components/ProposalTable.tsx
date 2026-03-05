import React, { useMemo, useRef, useState } from "react";
import ProposalRow from "./ProposalRow";
import { Proposal } from "@/lib/types/proposal";
import CustomDropdown from "@/components/ui/CustomDropdown";

type ProposalTableProps = {
  filteredProposals: Proposal[];
  updateProposal: (id: number, field: keyof Proposal, value: unknown) => Promise<void>;
  deleteProposal: (id: number) => Promise<{ ok: boolean; error?: string }>;
};

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export default function ProposalTable({ filteredProposals, updateProposal, deleteProposal }: ProposalTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const totalPages = Math.max(1, Math.ceil(filteredProposals.length / pageSize));

  const currentData = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredProposals.slice(start, start + pageSize);
  }, [filteredProposals, page, pageSize, totalPages]);

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (!e.ctrlKey || !scrollerRef.current) return;
    e.preventDefault();
    scrollerRef.current.scrollLeft += e.deltaY;
  };

  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--bg-soft)", borderRadius: 14, padding: 12, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ color: "var(--muted)", fontSize: 12 }}>
          Showing {currentData.length} of {filteredProposals.length} proposals
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CustomDropdown
            value={String(pageSize)}
            onChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
            options={PAGE_SIZE_OPTIONS.map((size) => ({ value: String(size), label: `${size} / page` }))}
            width={128}
          />
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={pagerBtn(page <= 1)}>Prev</button>
          <span style={{ color: "var(--muted)", fontSize: 12 }}>Page {Math.min(page, totalPages)} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={pagerBtn(page >= totalPages)}>Next</button>
        </div>
      </div>

      <div ref={scrollerRef} onWheel={onWheel} style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg-elev)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1400 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elev)" }}>
              {["Proposal", "Status", "Budget", "Connects", "Boost", "Loom", "Viewed", "Lead", "Date", "Follow Up", "Delete"].map((h) => (
                <th key={h} style={{ padding: "10px", textAlign: "left", fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((p) => (
              <ProposalRow key={p.id} p={p} isExpanded={expandedId === p.id} onToggleExpand={() => setExpandedId(expandedId === p.id ? null : p.id)} updateProposal={updateProposal} deleteProposal={deleteProposal} />
            ))}
          </tbody>
        </table>
      </div>

      {filteredProposals.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 }}>No proposals found.</div>}
    </div>
  );
}

function pagerBtn(disabled: boolean): React.CSSProperties {
  return {
    background: "var(--bg-soft)",
    border: "1px solid var(--border)",
    color: disabled ? "#7a8b9c" : "var(--text)",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    cursor: disabled ? "default" : "pointer",
  };
}
