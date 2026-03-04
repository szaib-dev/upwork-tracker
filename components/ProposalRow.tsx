import React, { useState } from "react";
import ProposalExpanded from "./ProposalExpanded";
import { STATUSES, STATUS_COLORS } from "./Filters";

// Helper components localized to avoid extra file clutter
function SmallToggle({ value, onChange }: any) {
  return (
    <button onClick={e => { e.stopPropagation(); onChange(!value); }} style={{
      background: value ? "#00D4FF20" : "#1E2830",
      color: value ? "#00D4FF" : "#4A5568",
      border: `1px solid ${value ? "#00D4FF40" : "#1E2830"}`,
      borderRadius: 5, padding: "2px 10px", fontSize: 11,
      fontFamily: "'DM Mono', monospace", cursor: "pointer", fontWeight: 600,
    }}>
      {value ? "YES" : "NO"}
    </button>
  );
}

function StatusBadge({ status, onChange }: any) {
  const [open, setOpen] = useState(false);
  const c = STATUS_COLORS[status] || STATUS_COLORS.Sent;
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }} style={{
        background: c.bg, color: c.text, border: `1px solid ${c.dot}30`,
        borderRadius: 6, padding: "3px 10px 3px 8px", fontSize: 12,
        fontFamily: "'Syne', sans-serif", fontWeight: 600, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
        {status}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "110%", left: 0, zIndex: 100, background: "#0E1318", border: "1px solid #1E2830", borderRadius: 8, overflow: "hidden", minWidth: 130 }}>
          {STATUSES.map(s => {
            const sc = STATUS_COLORS[s];
            return (
              <button key={s} onClick={e => { e.stopPropagation(); onChange(s); setOpen(false); }} style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 14px", background: s === status ? sc.bg : "transparent", color: sc.text, border: "none", cursor: "pointer", fontSize: 12, fontFamily: "'Syne', sans-serif", fontWeight: 600,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot }} /> {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const colStyle = (w: number) => ({ width: w, minWidth: w, padding: "0 12px" });

export default function ProposalRow({ p, isExpanded, onToggleExpand, updateProposal }: any) {
  return (
    <React.Fragment>
      <tr onClick={onToggleExpand} style={{ borderBottom: "1px solid #1E283080", cursor: "pointer", height: 48, transition: "background 0.15s" }}>
        <td style={{ ...colStyle(100), fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#4A5568" }}>
          {p.dateSent?.slice(5).replace("-", "/")}
        </td>
        <td style={{ ...colStyle(240) }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", maxWidth: 220 }}>
            {p.jobUrl ? <a href={p.jobUrl} onClick={e => e.stopPropagation()} target="_blank" rel="noopener noreferrer" style={{ color: "#00D4FF", textDecoration: "none" }}>{p.jobTitle}</a> : p.jobTitle}
          </span>
        </td>
        <td style={colStyle(120)} onClick={e => e.stopPropagation()}>
          <StatusBadge status={p.status} onChange={(v: string) => updateProposal(p.id, "status", v)} />
        </td>
        <td style={{ ...colStyle(90), fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#E2E8F0" }}>
          {p.budget ? `$${p.budget}` : <span style={{ color: "#1E2830" }}>—</span>}
        </td>
        <td style={{ ...colStyle(80), fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#00D4FF" }}>
          {p.connects || <span style={{ color: "#1E2830" }}>—</span>}
        </td>
        <td style={colStyle(70)} onClick={e => e.stopPropagation()}>
          <SmallToggle value={p.boosted} onChange={(v: boolean) => updateProposal(p.id, "boosted", v)} />
        </td>
        <td style={colStyle(70)} onClick={e => e.stopPropagation()}>
          <SmallToggle value={p.loom} onChange={(v: boolean) => updateProposal(p.id, "loom", v)} />
        </td>
        <td style={colStyle(70)} onClick={e => e.stopPropagation()}>
          <SmallToggle value={p.viewed} onChange={(v: boolean) => updateProposal(p.id, "viewed", v)} />
        </td>
        <td style={colStyle(70)} onClick={e => e.stopPropagation()}>
          <SmallToggle value={p.lead} onChange={(v: boolean) => updateProposal(p.id, "lead", v)} />
        </td>
        <td style={{ ...colStyle(100), fontSize: 12, color: "#94A3B8" }}>
          {p.clientCountry || <span style={{ color: "#1E2830" }}>—</span>}
        </td>
      </tr>

      {isExpanded && <ProposalExpanded p={p} updateProposal={updateProposal} />}
    </React.Fragment>
  );
}