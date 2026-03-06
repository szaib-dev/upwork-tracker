"use client";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import AppHeader from "@/components/AppHeader";
import { useProposals } from "@/hooks/proposal";
import ProposalTable from "@/components/ProposalTable";
import CustomDropdown from "@/components/ui/CustomDropdown";

function formatMonthKey(key: string) {
  return new Date(`${key}-01`).toLocaleString("en-US", { month: "long", year: "numeric" });
}

export default function ProgressPage() {
  const { session } = useAuth();
  const { proposals, loading, updateProposal, deleteProposal } = useProposals(session?.user?.id);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const months = useMemo(() => {
    const unique = Array.from(new Set(proposals.map((p) => p.dateSent.slice(0, 7)).filter(Boolean))).sort((a, b) => b.localeCompare(a));
    return unique.map((m) => ({ value: m, label: formatMonthKey(m) }));
  }, [proposals]);

  const monthFiltered = useMemo(() => {
    if (selectedMonth === "all") return proposals;
    return proposals.filter((p) => p.dateSent.startsWith(selectedMonth));
  }, [proposals, selectedMonth]);

  if (!session) return <div style={emptyState}>Please sign in first.</div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <AppHeader />
      <div style={{ padding: 10 }} className="months-main">
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ border: "1px solid var(--border)", background: "var(--bg-soft)", borderRadius: 12, padding: 10, marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: "var(--muted)", marginRight: 8 }}>Select month:</label>
            <div style={{ marginTop: 8 }}>
              <CustomDropdown value={selectedMonth} onChange={setSelectedMonth} options={[{ value: "all", label: "All months" }, ...months]} width={260} />
            </div>
          </div>

          {loading ? <div style={{ color: "var(--muted)" }}>Loading...</div> : <ProposalTable filteredProposals={monthFiltered} updateProposal={updateProposal} deleteProposal={deleteProposal} />}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .months-main {
            padding-left: 8px !important;
            padding-right: 8px !important;
            padding-top: 8px !important;
            padding-bottom: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}

const emptyState: React.CSSProperties = { minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg)", color: "var(--text)" };
