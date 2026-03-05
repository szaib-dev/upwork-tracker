"use client";
import { useMemo, useState } from "react";
import { Proposal } from "@/lib/types/proposal";
import CustomDropdown from "@/components/ui/CustomDropdown";

type SharedProposalTableProps = {
  proposals: Proposal[];
};

function previewText(text: string): string {
  if (!text) return "No preview available";
  return text.length > 250 ? `${text.slice(0, 250)}...` : text;
}

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export default function SharedProposalTable({ proposals }: SharedProposalTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const totalPages = Math.max(1, Math.ceil(proposals.length / pageSize));
  const currentData = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return proposals.slice(start, start + pageSize);
  }, [proposals, page, pageSize, totalPages]);

  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--bg-soft)", borderRadius: 14, padding: 12, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ color: "var(--muted)", fontSize: 12 }}>
          Showing {currentData.length} of {proposals.length} proposals
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
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={pagerBtn(page <= 1)}>
            Prev
          </button>
          <span style={{ color: "var(--muted)", fontSize: 12 }}>
            Page {Math.min(page, totalPages)} / {totalPages}
          </span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={pagerBtn(page >= totalPages)}>
            Next
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg-elev)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Proposal", "Status", "Budget", "Connects", "Viewed", "Date", "Follow Up"].map((h) => (
                <th key={h} style={{ padding: "10px", textAlign: "left", fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((p) => (
              <>
                <tr key={p.id} onClick={() => setExpandedId((curr) => (curr === p.id ? null : p.id))} style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", verticalAlign: "top" }}>
                  <td style={{ padding: "8px 10px", minWidth: 360 }}>
                    {p.jobUrl ? (
                      <a href={p.jobUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: "inline-block", fontSize: 14, fontWeight: 700, marginBottom: 4, textDecoration: "none", color: "var(--text)" }}>
                        {p.jobTitle || "Untitled Proposal"}
                      </a>
                    ) : (
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{p.jobTitle || "Untitled Proposal"}</div>
                    )}
                    <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.45 }}>{previewText(p.proposalText)}</div>
                  </td>
                  <td style={{ padding: "10px 10px", color: "var(--text)", fontSize: 12 }}>{p.status}</td>
                  <td style={{ padding: "10px 10px", color: "var(--text)", fontSize: 12 }}>{p.budget ? `$${p.budget}` : "-"}</td>
                  <td style={{ padding: "10px 10px", color: "var(--primary)", fontSize: 12 }}>{p.connects || "-"}</td>
                  <td style={{ padding: "10px 10px", color: "var(--text)", fontSize: 12 }}>{p.viewed ? "YES" : "NO"}</td>
                  <td style={{ padding: "10px 10px", color: "var(--muted)", fontSize: 12 }}>{p.dateSent?.slice(5).replace("-", "/")}</td>
                  <td style={{ padding: "10px 10px", color: "var(--muted)", fontSize: 12 }}>{p.followUpAt ? new Date(p.followUpAt).toLocaleString() : "-"}</td>
                </tr>
                {expandedId === p.id && (
                  <tr key={`${p.id}-expanded`} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td colSpan={7} style={{ padding: 10 }}>
                      <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10, background: "var(--bg-soft)" }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Full Proposal</div>
                        <div style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.55 }}>{p.proposalText || "No proposal text."}</div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function pagerBtn(disabled: boolean): React.CSSProperties {
  return {
    background: "var(--bg-elev)",
    border: "1px solid var(--border)",
    color: disabled ? "#7a8b9c" : "var(--text)",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    cursor: disabled ? "default" : "pointer",
  };
}
