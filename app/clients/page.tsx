"use client";
import { useMemo, useState } from "react";
import { FaEnvelope, FaGlobe, FaLinkedin, FaTwitter, FaTrash } from "react-icons/fa";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { useProposals } from "@/hooks/proposal";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { useToast } from "@/components/ui/ToastProvider";
import CustomDropdown from "@/components/ui/CustomDropdown";
import { STATUSES } from "@/components/Filters";

type ClientDetail = {
  key: string;
  name: string;
  email: string;
  country: string;
  proposalIds: number[];
  proposals: { id: number; title: string; status: string; followUpAt: string; dateSent: string }[];
  socials: { linkedin: string; twitter: string; upwork: string; website: string };
};

function normalizeLink(raw: string) {
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `https://${raw}`;
}

export default function ClientsPage() {
  const { session } = useAuth();
  const { proposals, loading, updateProposal, deleteProposal } = useProposals(session?.user?.id);
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [selectedClientKey, setSelectedClientKey] = useState("");
  const [bulkStatus, setBulkStatus] = useState<string>("Sent");
  const [bulkFollowAt, setBulkFollowAt] = useState("");

  const clients = useMemo<ClientDetail[]>(() => {
    const map: Record<string, ClientDetail> = {};
    proposals.forEach((p) => {
      const key = (p.clientEmail || p.clientName || `client-${p.id}`).toLowerCase();
      if (!map[key]) {
        map[key] = {
          key,
          name: p.clientName || "Unknown Client",
          email: p.clientEmail || "",
          country: p.clientCountry || "",
          proposalIds: [],
          proposals: [],
          socials: { linkedin: "", twitter: "", upwork: "", website: "" },
        };
      }
      map[key].proposalIds.push(p.id);
      map[key].proposals.push({ id: p.id, title: p.jobTitle || `Proposal #${p.id}`, status: p.status, followUpAt: p.followUpAt, dateSent: p.dateSent });
      map[key].socials.linkedin ||= p.socials?.linkedin || "";
      map[key].socials.twitter ||= p.socials?.twitter || "";
      map[key].socials.upwork ||= p.socials?.upwork || "";
      map[key].socials.website ||= p.socials?.website || "";
    });
    return Object.values(map).sort((a, b) => b.proposalIds.length - a.proposalIds.length);
  }, [proposals]);

  const selected = useMemo(() => clients.find((c) => c.key === selectedClientKey) ?? clients[0] ?? null, [clients, selectedClientKey]);

  const setStatusForClient = async () => {
    if (!selected) return;
    for (const id of selected.proposalIds) await updateProposal(id, "status", bulkStatus);
    toast("Status updated for client proposals.", "success");
  };

  const scheduleForClient = async () => {
    if (!selected || !bulkFollowAt) {
      toast("Select follow-up date/time first.", "error");
      return;
    }
    for (const id of selected.proposalIds) await updateProposal(id, "followUpAt", bulkFollowAt);
    toast("Follow-up scheduled for client.", "success");
  };

  const deleteClient = async () => {
    if (!selected) return;
    const ok = await confirm("This will delete all proposals under this client.", "Delete client and proposals?");
    if (!ok) return;
    for (const id of selected.proposalIds) await deleteProposal(id);
    toast("Client proposals deleted.", "success");
  };

  if (!session) return <div style={emptyState}>Please sign in first.</div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <AppHeader />
      <main style={{ width: "100%", maxWidth: 1240, margin: "0 auto", padding: "14px 12px 24px", display: "grid", gap: 12 }}>
        <section style={panel}>
          <h1 style={{ margin: 0, fontSize: 28 }}>Clients</h1>
          <div style={{ color: "var(--muted)", marginTop: 4, fontSize: 13 }}>Select a client to open details and run actions.</div>
        </section>

        {loading ? (
          <div style={{ color: "var(--muted)" }}>Loading clients...</div>
        ) : (
          <section style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12 }}>
            <div style={{ ...panel, maxHeight: "72vh", overflowY: "auto" }}>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Client List</div>
              <div style={{ display: "grid", gap: 8 }}>
                {clients.map((c) => (
                  <button key={c.key} onClick={() => setSelectedClientKey(c.key)} style={{ textAlign: "left", background: selected?.key === c.key ? "var(--primary-soft)" : "var(--bg-elev)", border: `1px solid ${selected?.key === c.key ? "var(--primary)" : "var(--border)"}`, color: "var(--text)", borderRadius: 10, padding: "9px 10px", cursor: "pointer" }}>
                    <div style={{ fontWeight: 700 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{c.email || "No email"} | {c.proposalIds.length} proposals</div>
                  </button>
                ))}
                {clients.length === 0 && <div style={{ color: "var(--muted)", fontSize: 13 }}>No clients yet.</div>}
              </div>
            </div>

            <div style={panel}>
              {!selected && <div style={{ color: "var(--muted)" }}>Select a client to view details.</div>}
              {selected && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 800 }}>{selected.name}</div>
                      <div style={{ color: "var(--muted)", fontSize: 13 }}>{selected.email || "No email"} {selected.country ? `| ${selected.country}` : ""}</div>
                    </div>
                    <button onClick={() => void deleteClient()} style={dangerBtn}><FaTrash /> Delete Client Data</button>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {selected.socials.linkedin && <a href={normalizeLink(selected.socials.linkedin)} target="_blank" rel="noreferrer" style={linkChip}><FaLinkedin /> LinkedIn</a>}
                    {selected.socials.twitter && <a href={normalizeLink(selected.socials.twitter)} target="_blank" rel="noreferrer" style={linkChip}><FaTwitter /> Twitter</a>}
                    {selected.socials.website && <a href={normalizeLink(selected.socials.website)} target="_blank" rel="noreferrer" style={linkChip}><FaGlobe /> Website</a>}
                    {selected.email && <a href={`mailto:${selected.email}`} style={linkChip}><FaEnvelope /> Email</a>}
                  </div>

                  <div style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 10, padding: 10, display: "grid", gap: 8 }}>
                    <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Bulk Actions</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <CustomDropdown value={bulkStatus} onChange={setBulkStatus} options={STATUSES.map((s) => ({ value: s, label: s }))} width={180} placeholder="Set status" />
                      <button onClick={() => void setStatusForClient()} style={actionBtn}>Apply Status</button>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <input type="datetime-local" value={bulkFollowAt} onChange={(e) => setBulkFollowAt(e.target.value)} style={input} />
                      <button onClick={() => void scheduleForClient()} style={actionBtn}>Schedule Follow Up</button>
                    </div>
                  </div>

                  <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "var(--bg-elev)" }}>
                          {["Proposal", "Status", "Date", "Follow Up"].map((head) => (
                            <th key={head} style={{ textAlign: "left", padding: "9px 10px", fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{head}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selected.proposals.map((p) => (
                          <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}>
                            <td style={cell}>{p.title}</td>
                            <td style={cell}>{p.status}</td>
                            <td style={cell}>{p.dateSent}</td>
                            <td style={cell}>{p.followUpAt ? new Date(p.followUpAt).toLocaleString() : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const panel: React.CSSProperties = { background: "var(--bg-soft)", border: "1px solid var(--border)", borderRadius: 14, padding: 12 };
const input: React.CSSProperties = { background: "var(--bg-soft)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", padding: "8px 10px" };
const actionBtn: React.CSSProperties = { background: "var(--primary-soft)", border: "1px solid var(--primary)", color: "var(--primary)", borderRadius: 8, padding: "8px 10px", fontWeight: 700, cursor: "pointer" };
const dangerBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid color-mix(in srgb, var(--danger) 65%, var(--border))", color: "var(--danger)", borderRadius: 8, padding: "8px 10px", cursor: "pointer" };
const linkChip: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 999, color: "var(--text)", padding: "6px 10px", textDecoration: "none", fontSize: 13 };
const cell: React.CSSProperties = { padding: "9px 10px", fontSize: 13, color: "var(--text)" };
const emptyState: React.CSSProperties = { minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg)", color: "var(--text)" };

