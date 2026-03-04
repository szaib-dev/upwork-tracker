import React, { useState } from "react";
import { STATUSES, STATUS_COLORS } from "./Filters";

const inputStyle = { background: "#080C10", border: "1px solid #1E2830", borderRadius: 7, color: "#E2E8F0", fontFamily: "'DM Mono', monospace", fontSize: 13, padding: "9px 12px", width: "100%", outline: "none", boxSizing: "border-box" as const };

function DrawerField({ label, children }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, color: "#4A5568", fontFamily: "'Syne', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

export function Toggle({ label, value, onChange, color = "#00D4FF" }: any) {
  return (
    <button onClick={e => { e.stopPropagation(); onChange(!value); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: value ? `${color}12` : "#080C10", border: `1px solid ${value ? color + "40" : "#1E2830"}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer", transition: "all 0.15s" }}>
      <span style={{ fontSize: 12, color: value ? color : "#4A5568", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600, color: value ? color : "#2A3440", letterSpacing: "0.05em" }}>{value ? "YES" : "NO"}</span>
    </button>
  );
}

export default function AddProposalDrawer({ closeDrawer, addProposal }: any) {
  const emptyForm = {
    dateSent: new Date().toISOString().split("T")[0],
    jobTitle: "", jobUrl: "", budget: "", connects: "",
    boosted: false, loom: false, viewed: false, lead: false,
    status: "Sent", replyDate: "", clientCountry: "", clientName: "",
    proposalText: "", socials: { linkedin: "", twitter: "", upwork: "", website: "" },
  };
  
  const [form, setForm] = useState(emptyForm);
  const [socialsOpen, setSocialsOpen] = useState(false);

  const handleSubmit = () => {
    addProposal({ ...form, budget: Number(form.budget) || 0, connects: Number(form.connects) || 0 });
    closeDrawer();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      <div onClick={closeDrawer} style={{ position: "absolute", inset: 0, background: "#00000090" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 420, background: "#0E1318", borderLeft: "1px solid #1E2830", display: "flex", flexDirection: "column", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>New Proposal</div>
          <button onClick={closeDrawer} style={{ background: "none", border: "none", color: "#4A5568", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        <DrawerField label="Date Sent"><input type="date" value={form.dateSent} onChange={e => setForm(f => ({ ...f, dateSent: e.target.value }))} style={inputStyle} /></DrawerField>
        <DrawerField label="Job Title"><input type="text" placeholder="e.g. Next.js Dashboard" value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} style={inputStyle} /></DrawerField>
        <DrawerField label="Job URL"><input type="url" placeholder="https://upwork.com/jobs/..." value={form.jobUrl} onChange={e => setForm(f => ({ ...f, jobUrl: e.target.value }))} style={inputStyle} /></DrawerField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <DrawerField label="Budget ($)"><input type="number" placeholder="500" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} style={inputStyle} /></DrawerField>
          <DrawerField label="Connects"><input type="number" placeholder="6" value={form.connects} onChange={e => setForm(f => ({ ...f, connects: e.target.value }))} style={inputStyle} /></DrawerField>
        </div>

        <DrawerField label="Flags">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Toggle label="Boosted" value={form.boosted} onChange={(v: boolean) => setForm(f => ({ ...f, boosted: v }))} color="#FF8C42" />
            <Toggle label="Loom" value={form.loom} onChange={(v: boolean) => setForm(f => ({ ...f, loom: v }))} color="#00D4FF" />
            <Toggle label="Viewed" value={form.viewed} onChange={(v: boolean) => setForm(f => ({ ...f, viewed: v }))} color="#FFD060" />
            <Toggle label="Lead" value={form.lead} onChange={(v: boolean) => setForm(f => ({ ...f, lead: v }))} color="#00E599" />
          </div>
        </DrawerField>

        <DrawerField label="Client Name"><input type="text" placeholder="e.g. James W." value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} style={inputStyle} /></DrawerField>
        
        <button onClick={handleSubmit} disabled={!form.jobTitle} style={{
          background: form.jobTitle ? "#00D4FF" : "#1E2830", color: form.jobTitle ? "#080C10" : "#4A5568",
          border: "none", borderRadius: 8, padding: "12px", width: "100%", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14,
          cursor: form.jobTitle ? "pointer" : "default", marginTop: 8,
        }}>
          Save Proposal
        </button>
      </div>
    </div>
  );
}