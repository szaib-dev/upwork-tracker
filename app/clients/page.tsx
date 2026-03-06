"use client";
import { useMemo, useState } from "react";
import { FaEnvelope, FaGlobe, FaLinkedin, FaTwitter, FaTrash, FaChevronLeft } from "react-icons/fa";
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

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export default function ClientsPage() {
  const { session } = useAuth();
  const { proposals, loading, updateProposal, deleteProposal } = useProposals(session?.user?.id);
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [selectedClientKey, setSelectedClientKey] = useState("");
  const [bulkStatus, setBulkStatus] = useState<string>("Sent");
  const [bulkFollowAt, setBulkFollowAt] = useState("");
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

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

  const selected = useMemo(
    () => clients.find((c) => c.key === selectedClientKey) ?? clients[0] ?? null,
    [clients, selectedClientKey],
  );

  const handleSelectClient = (key: string) => {
    setSelectedClientKey(key);
    setMobileShowDetail(true);
  };

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
    setMobileShowDetail(false);
  };

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg)", color: "var(--text)" }}>
        Please sign in first.
      </div>
    );
  }

  return (
    <>
      <style>{`
        .cp-main {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 14px 12px 32px;
          display: grid;
          gap: 12px;
        }

        /* Hero */
        .cp-hero {
          background: var(--bg-soft);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 18px 20px;
          position: relative;
          overflow: hidden;
        }
        .cp-hero::after {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, color-mix(in srgb, var(--primary) 10%, transparent), transparent 70%);
          pointer-events: none;
        }
        .cp-hero h1 {
          margin: 0;
          font-size: clamp(22px, 4vw, 30px);
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }
        .cp-hero p {
          margin: 5px 0 0;
          font-size: 13px;
          color: var(--muted);
        }

        /* Layout */
        .cp-layout {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 12px;
          align-items: start;
        }

        /* Sidebar */
        .cp-sidebar {
          background: var(--bg-soft);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 14px;
          max-height: 76vh;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }
        .cp-sidebar-label {
          font-size: 10px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border);
        }
        .cp-client-btn {
          width: 100%;
          text-align: left;
          background: var(--bg-elev);
          border: 1px solid var(--border);
          color: var(--text);
          border-radius: 12px;
          padding: 10px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: border-color 0.15s, background 0.15s, transform 0.1s;
          margin-bottom: 6px;
        }
        .cp-client-btn:last-child { margin-bottom: 0; }
        .cp-client-btn:hover {
          border-color: color-mix(in srgb, var(--primary) 40%, var(--border));
          transform: translateX(2px);
        }
        .cp-client-btn.active {
          background: var(--primary-soft);
          border-color: var(--primary);
        }
        .cp-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: color-mix(in srgb, var(--primary) 15%, var(--bg-elev));
          border: 1px solid color-mix(in srgb, var(--primary) 30%, var(--border));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          color: var(--primary);
          flex-shrink: 0;
          letter-spacing: 0.02em;
        }
        .cp-client-name { font-weight: 700; font-size: 14px; line-height: 1.2; }
        .cp-client-meta { font-size: 11px; color: var(--muted); margin-top: 2px; }
        .cp-proposal-badge {
          margin-left: auto;
          font-size: 10px;
          font-weight: 700;
          background: color-mix(in srgb, var(--primary) 12%, var(--bg));
          border: 1px solid color-mix(in srgb, var(--primary) 25%, var(--border));
          color: var(--primary);
          border-radius: 999px;
          padding: 2px 8px;
          flex-shrink: 0;
        }

        /* Detail panel */
        .cp-detail {
          background: var(--bg-soft);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px;
          display: grid;
          gap: 14px;
        }
        .cp-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          flex-wrap: wrap;
        }
        .cp-detail-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: color-mix(in srgb, var(--primary) 15%, var(--bg-elev));
          border: 1px solid color-mix(in srgb, var(--primary) 30%, var(--border));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 800;
          color: var(--primary);
          flex-shrink: 0;
        }
        .cp-detail-name { font-size: clamp(18px, 3vw, 24px); font-weight: 800; letter-spacing: -0.02em; }
        .cp-detail-sub { color: var(--muted); font-size: 13px; margin-top: 3px; }

        .cp-danger-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: transparent;
          border: 1px solid color-mix(in srgb, var(--danger) 55%, var(--border));
          color: var(--danger);
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .cp-danger-btn:hover {
          background: color-mix(in srgb, var(--danger) 8%, transparent);
        }

        /* Social chips */
        .cp-socials { display: flex; gap: 8px; flex-wrap: wrap; }
        .cp-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-elev);
          border: 1px solid var(--border);
          border-radius: 999px;
          color: var(--text);
          padding: 6px 12px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
          transition: border-color 0.15s, color 0.15s;
        }
        .cp-chip:hover {
          border-color: color-mix(in srgb, var(--primary) 50%, var(--border));
          color: var(--primary);
        }

        /* Bulk actions */
        .cp-bulk {
          background: var(--bg-elev);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 14px;
          display: grid;
          gap: 10px;
        }
        .cp-bulk-label {
          font-size: 10px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
        }
        .cp-bulk-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        .cp-action-btn {
          background: var(--primary-soft);
          border: 1px solid var(--primary);
          color: var(--primary);
          border-radius: 9px;
          padding: 8px 14px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: opacity 0.15s;
          white-space: nowrap;
        }
        .cp-action-btn:hover { opacity: 0.82; }
        .cp-input {
          background: var(--bg-soft);
          border: 1px solid var(--border);
          border-radius: 9px;
          color: var(--text);
          padding: 8px 10px;
          font-size: 13px;
          flex: 1;
          min-width: 180px;
        }

        /* Table */
        .cp-table-wrap {
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          overflow-x: auto;
        }
        .cp-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 480px;
        }
        .cp-table thead tr {
          background: var(--bg-elev);
        }
        .cp-table th {
          text-align: left;
          padding: 10px 12px;
          font-size: 10px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
        }
        .cp-table tbody tr {
          border-top: 1px solid var(--border);
          transition: background 0.1s;
        }
        .cp-table tbody tr:hover {
          background: color-mix(in srgb, var(--primary) 4%, transparent);
        }
        .cp-table td {
          padding: 10px 12px;
          font-size: 13px;
          color: var(--text);
        }
        .cp-status-pill {
          display: inline-block;
          padding: 2px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          background: color-mix(in srgb, var(--primary) 12%, var(--bg-elev));
          color: var(--primary);
          border: 1px solid color-mix(in srgb, var(--primary) 25%, var(--border));
        }

        /* Mobile back button */
        .cp-back-btn {
          display: none;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text);
          border-radius: 9px;
          padding: 7px 12px;
          font-size: 13px;
          cursor: pointer;
          margin-bottom: 4px;
        }

        /* Empty state */
        .cp-empty {
          color: var(--muted);
          font-size: 13px;
          padding: 8px 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .cp-layout {
            grid-template-columns: 1fr;
          }
          .cp-sidebar {
            max-height: none;
          }
          .cp-sidebar.mobile-hidden { display: none; }
          .cp-detail.mobile-hidden { display: none; }
          .cp-back-btn { display: inline-flex; }
        }

        @media (max-width: 480px) {
          .cp-main { padding: 10px 10px 24px; }
          .cp-hero { padding: 14px; }
          .cp-detail { padding: 12px; }
          .cp-bulk { padding: 10px 12px; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
        <AppHeader />
        <main className="cp-main">

          {/* Hero */}
          <section className="cp-hero">
            <h1>Clients</h1>
            <p>Select a client to open details and run actions.</p>
          </section>

          {loading ? (
            <div className="cp-empty">Loading clients...</div>
          ) : (
            <section className="cp-layout">

              {/* Sidebar */}
              <div className={`cp-sidebar${mobileShowDetail ? " mobile-hidden" : ""}`}>
                <div className="cp-sidebar-label">
                  {clients.length} Client{clients.length !== 1 ? "s" : ""}
                </div>
                <div>
                  {clients.map((c) => (
                    <button
                      key={c.key}
                      className={`cp-client-btn${selected?.key === c.key ? " active" : ""}`}
                      onClick={() => handleSelectClient(c.key)}
                    >
                      <div className="cp-avatar">{getInitials(c.name)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="cp-client-name">{c.name}</div>
                        <div className="cp-client-meta">{c.email || "No email"}</div>
                      </div>
                      <div className="cp-proposal-badge">{c.proposalIds.length}</div>
                    </button>
                  ))}
                  {clients.length === 0 && <div className="cp-empty">No clients yet.</div>}
                </div>
              </div>

              {/* Detail */}
              <div className={`cp-detail${!mobileShowDetail ? " mobile-hidden" : ""}`} style={{ display: !selected && !mobileShowDetail ? "none" : undefined }}>

                {/* Mobile back */}
                <button className="cp-back-btn" onClick={() => setMobileShowDetail(false)}>
                  <FaChevronLeft size={11} /> All Clients
                </button>

                {!selected && <div className="cp-empty">Select a client to view details.</div>}

                {selected && (
                  <>
                    {/* Header */}
                    <div className="cp-detail-header">
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="cp-detail-avatar">{getInitials(selected.name)}</div>
                        <div>
                          <div className="cp-detail-name">{selected.name}</div>
                          <div className="cp-detail-sub">
                            {selected.email || "No email"}
                            {selected.country ? ` · ${selected.country}` : ""}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => void deleteClient()} className="cp-danger-btn">
                        <FaTrash size={12} /> Delete Client
                      </button>
                    </div>

                    {/* Socials */}
                    <div className="cp-socials">
                      {selected.socials.linkedin && (
                        <a href={normalizeLink(selected.socials.linkedin)} target="_blank" rel="noreferrer" className="cp-chip">
                          <FaLinkedin size={12} /> LinkedIn
                        </a>
                      )}
                      {selected.socials.twitter && (
                        <a href={normalizeLink(selected.socials.twitter)} target="_blank" rel="noreferrer" className="cp-chip">
                          <FaTwitter size={12} /> Twitter
                        </a>
                      )}
                      {selected.socials.website && (
                        <a href={normalizeLink(selected.socials.website)} target="_blank" rel="noreferrer" className="cp-chip">
                          <FaGlobe size={12} /> Website
                        </a>
                      )}
                      {selected.email && (
                        <a href={`mailto:${selected.email}`} className="cp-chip">
                          <FaEnvelope size={12} /> Email
                        </a>
                      )}
                    </div>

                    {/* Bulk Actions */}
                    <div className="cp-bulk">
                      <div className="cp-bulk-label">Bulk Actions</div>
                      <div className="cp-bulk-row">
                        <CustomDropdown
                          value={bulkStatus}
                          onChange={setBulkStatus}
                          options={STATUSES.map((s) => ({ value: s, label: s }))}
                          width={180}
                          placeholder="Set status"
                        />
                        <button onClick={() => void setStatusForClient()} className="cp-action-btn">
                          Apply Status
                        </button>
                      </div>
                      <div className="cp-bulk-row">
                        <input
                          type="datetime-local"
                          value={bulkFollowAt}
                          onChange={(e) => setBulkFollowAt(e.target.value)}
                          className="cp-input"
                        />
                        <button onClick={() => void scheduleForClient()} className="cp-action-btn">
                          Schedule Follow Up
                        </button>
                      </div>
                    </div>

                    {/* Proposals Table */}
                    <div className="cp-table-wrap">
                      <table className="cp-table">
                        <thead>
                          <tr>
                            {["Proposal", "Status", "Date Sent", "Follow Up"].map((h) => (
                              <th key={h}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selected.proposals.map((p) => (
                            <tr key={p.id}>
                              <td style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {p.title}
                              </td>
                              <td>
                                <span className="cp-status-pill">{p.status}</span>
                              </td>
                              <td style={{ whiteSpace: "nowrap" }}>{p.dateSent}</td>
                              <td style={{ whiteSpace: "nowrap", color: "var(--muted)" }}>
                                {p.followUpAt ? new Date(p.followUpAt).toLocaleString() : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

            </section>
          )}
        </main>
      </div>
    </>
  );
}