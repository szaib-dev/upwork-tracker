import React, { useState } from "react";
import { Toggle } from "./AddProposalDrawer";
import { Proposal } from "@/lib/types/proposal";

const inputStyle = {
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text)",
  fontSize: 12,
  padding: "8px 10px",
  width: "100%",
  outline: "none",
  boxSizing: "border-box" as const,
};

type ProposalExpandedProps = {
  p: Proposal;
  updateProposal: (id: number, field: keyof Proposal, value: unknown) => Promise<void>;
};

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg-soft)", border: "1px solid var(--border)", borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

export default function ProposalExpanded({ p, updateProposal }: ProposalExpandedProps) {
  const [socialsOpen, setSocialsOpen] = useState(false);

  return (
    <tr>
      <td colSpan={11} style={{ padding: "0 0 14px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ margin: "10px 12px 0", borderRadius: 14, background: "var(--bg-elev)", border: "1px solid var(--border)", padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1.3fr", gap: 10 }}>
          <Block title="Details">
            <div style={{ display: "grid", gap: 8 }}>
              <input defaultValue={p.jobTitle} onBlur={(e) => void updateProposal(p.id, "jobTitle", e.target.value)} style={inputStyle} />
              <input defaultValue={p.jobUrl} onBlur={(e) => void updateProposal(p.id, "jobUrl", e.target.value)} style={inputStyle} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input type="number" defaultValue={p.budget} onBlur={(e) => void updateProposal(p.id, "budget", Number(e.target.value) || 0)} style={inputStyle} />
                <input type="number" defaultValue={p.connects} onBlur={(e) => void updateProposal(p.id, "connects", Number(e.target.value) || 0)} style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input type="date" defaultValue={p.dateSent} onBlur={(e) => void updateProposal(p.id, "dateSent", e.target.value)} style={inputStyle} />
                <input type="datetime-local" defaultValue={p.followUpAt} onBlur={(e) => void updateProposal(p.id, "followUpAt", e.target.value)} style={inputStyle} />
              </div>
            </div>
          </Block>

          <Block title="Client & Flags">
            <div style={{ display: "grid", gap: 8 }}>
              <input defaultValue={p.clientName} placeholder="Client name" onBlur={(e) => void updateProposal(p.id, "clientName", e.target.value)} style={inputStyle} />
              <input defaultValue={p.clientEmail} placeholder="Client email" onBlur={(e) => void updateProposal(p.id, "clientEmail", e.target.value)} style={inputStyle} />
              <input defaultValue={p.clientCountry} placeholder="Country" onBlur={(e) => void updateProposal(p.id, "clientCountry", e.target.value)} style={inputStyle} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <Toggle label="Boosted" value={p.boosted} onChange={(v) => void updateProposal(p.id, "boosted", v)} color="#ff9d5c" />
                <Toggle label="Loom" value={p.loom} onChange={(v) => void updateProposal(p.id, "loom", v)} color="var(--primary)" />
                <Toggle label="Viewed" value={p.viewed} onChange={(v) => void updateProposal(p.id, "viewed", v)} color="#ffd06b" />
                <Toggle label="Lead" value={p.lead} onChange={(v) => void updateProposal(p.id, "lead", v)} color="#32db98" />
              </div>

              <button onClick={() => setSocialsOpen((x) => !x)} style={{ background: "var(--bg-elev)", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer", textAlign: "left" }}>
                Social Profiles {socialsOpen ? "-" : "+"}
              </button>

              {socialsOpen && (
                <div style={{ display: "grid", gap: 6 }}>
                  {[
                    ["linkedin", "LinkedIn"],
                    ["twitter", "X"],
                    ["upwork", "Upwork"],
                    ["website", "Website"],
                  ].map(([key, label]) => (
                    <input key={key} defaultValue={p.socials?.[key] ?? ""} placeholder={label} onBlur={(e) => void updateProposal(p.id, "socials", { ...p.socials, [key]: e.target.value })} style={inputStyle} />
                  ))}
                </div>
              )}
            </div>
          </Block>

          <Block title="Proposal Content">
            <textarea defaultValue={p.proposalText || ""} onBlur={(e) => void updateProposal(p.id, "proposalText", e.target.value)} style={{ ...inputStyle, minHeight: 280, lineHeight: 1.6 }} />
          </Block>
        </div>
      </td>
    </tr>
  );
}
