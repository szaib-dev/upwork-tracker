import React, { useState } from "react";
import { Toggle } from "./AddProposalDrawer";

const inputStyle = {
  background: "#080C10", border: "1px solid #1E2830", borderRadius: 7,
  color: "#E2E8F0", fontFamily: "'DM Mono', monospace", fontSize: 13,
  padding: "9px 12px", width: "100%", outline: "none", boxSizing: "border-box" as const,
};

export default function ProposalExpanded({ p, updateProposal }: any) {
  const [editingInline, setEditingInline] = useState<{ field: string | null, socialsOpen?: boolean }>({ field: null });

  const startInline = (field: string) => setEditingInline({ ...editingInline, field });
  const stopInline = () => setEditingInline({ ...editingInline, field: null });

  const hasSocials = p.socials && Object.values(p.socials).some(v => v);

  return (
    <tr>
      <td colSpan={10} style={{ padding: 0, borderBottom: "1px solid #00D4FF30" }}>
        <div style={{ background: "#0A0F15", borderLeft: "2px solid #00D4FF40", padding: "24px 28px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>

          {/* Col 1 — Job details */}
          <div>
            <div style={{ fontSize: 11, color: "#4A5568", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>Details</div>
            {[
              { label: "Job Title", field: "jobTitle", type: "text" },
              { label: "Job URL", field: "jobUrl", type: "text" },
              { label: "Budget ($)", field: "budget", type: "number" },
              { label: "Connects", field: "connects", type: "number" },
              { label: "Date Sent", field: "dateSent", type: "date" },
              { label: "Reply Date", field: "replyDate", type: "date" },
            ].map(({ label, field, type }) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#4A5568", marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Syne', sans-serif" }}>{label}</div>
                {editingInline.field === field ? (
                  <input 
                    autoFocus
                    type={type}
                    defaultValue={p[field]}
                    onBlur={e => { 
                      updateProposal(p.id, field, type === "number" ? Number(e.target.value) : e.target.value); 
                      stopInline(); 
                    }}
                    onClick={e => e.stopPropagation()}
                    style={{ ...inputStyle, padding: "6px 10px", fontSize: 12 }} 
                  />
                ) : (
                  <div 
                    onClick={e => { e.stopPropagation(); startInline(field); }}
                    style={{ fontSize: 13, color: p[field] ? "#E2E8F0" : "#2A3440", fontFamily: "'DM Mono', monospace", cursor: "text", padding: "4px 0", borderBottom: "1px dashed #1E2830" }}>
                    {p[field] || "click to edit"}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Col 2 — Client + Flags + Socials */}
          <div>
            <div style={{ fontSize: 11, color: "#4A5568", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>Client</div>
            {[{ label: "Client Name", field: "clientName" }, { label: "Country", field: "clientCountry" }].map(({ label, field }) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#4A5568", marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Syne', sans-serif" }}>{label}</div>
                {editingInline.field === field ? (
                  <input autoFocus type="text" defaultValue={p[field]}
                    onBlur={e => { updateProposal(p.id, field, e.target.value); stopInline(); }}
                    onClick={e => e.stopPropagation()}
                    style={{ ...inputStyle, padding: "6px 10px", fontSize: 12 }} />
                ) : (
                  <div onClick={e => { e.stopPropagation(); startInline(field); }}
                    style={{ fontSize: 13, color: p[field] ? "#E2E8F0" : "#2A3440", fontFamily: "'DM Mono', monospace", cursor: "text", padding: "4px 0", borderBottom: "1px dashed #1E2830" }}>
                    {p[field] || "click to edit"}
                  </div>
                )}
              </div>
            ))}

            {/* Flags */}
            <div style={{ fontSize: 11, color: "#4A5568", letterSpacing: "0.08em", textTransform: "uppercase", margin: "14px 0 10px", fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>Flags</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <Toggle label="Boosted" value={p.boosted} onChange={(v: boolean) => updateProposal(p.id, "boosted", v)} color="#FF8C42" />
              <Toggle label="Loom" value={p.loom} onChange={(v: boolean) => updateProposal(p.id, "loom", v)} color="#00D4FF" />
              <Toggle label="Viewed" value={p.viewed} onChange={(v: boolean) => updateProposal(p.id, "viewed", v)} color="#FFD060" />
              <Toggle label="Lead" value={p.lead} onChange={(v: boolean) => updateProposal(p.id, "lead", v)} color="#00E599" />
            </div>

            {/* Socials */}
            <div style={{ marginTop: 14 }}>
              <button
                onClick={e => { e.stopPropagation(); setEditingInline({ ...editingInline, socialsOpen: !editingInline.socialsOpen }); }}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 8 }}
              >
                <span style={{ fontSize: 11, color: "#4A5568", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                  Socials {hasSocials ? <span style={{ color: "#00D4FF" }}>●</span> : ""}
                </span>
                <span style={{ fontSize: 10, color: "#2A3440" }}>{editingInline.socialsOpen ? "▲" : "▼"}</span>
              </button>
              
              {editingInline.socialsOpen && (
                <div>
                  {[["linkedin", "LinkedIn"], ["twitter", "X/Twitter"], ["upwork", "Upwork"], ["website", "Website"]].map(([k, l]) => (
                    <div key={k} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: "#4A5568", marginBottom: 3, fontFamily: "'Syne', sans-serif" }}>{l}</div>
                      <input type="url" placeholder="https://"
                        defaultValue={p.socials?.[k] || ""}
                        onBlur={e => updateProposal(p.id, "socials", { ...p.socials, [k]: e.target.value })}
                        onClick={e => e.stopPropagation()}
                        style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} />
                    </div>
                  ))}
                </div>
              )}
              
              {!editingInline.socialsOpen && hasSocials && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[["linkedin", "LI"], ["twitter", "X"], ["upwork", "UP"], ["website", "WEB"]].map(([k, l]) =>
                    p.socials?.[k] ? (
                      <a key={k} href={p.socials[k]} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        style={{ fontSize: 11, color: "#00D4FF", fontFamily: "'DM Mono', monospace", textDecoration: "none", background: "#00D4FF15", border: "1px solid #00D4FF30", borderRadius: 4, padding: "2px 8px" }}>
                        {l}
                      </a>
                    ) : null
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Col 3 — Proposal Text */}
          <div>
            <div style={{ fontSize: 11, color: "#4A5568", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>Proposal Text</div>
            <textarea 
              defaultValue={p.proposalText || ""}
              onBlur={e => updateProposal(p.id, "proposalText", e.target.value)}
              placeholder="Paste your proposal text here..."
              onClick={e => e.stopPropagation()}
              style={{ ...inputStyle, height: 260, resize: "none", lineHeight: 1.6, color: "#94A3B8" }} 
            />
          </div>
        </div>
      </td>
    </tr>
  );
}