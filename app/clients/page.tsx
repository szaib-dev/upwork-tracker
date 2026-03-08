"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
	FaEnvelope,
	FaGlobe,
	FaLinkedin,
	FaTwitter,
	FaComments,
	FaTrash,
	FaChevronLeft,
	FaUserPlus,
	FaExternalLinkAlt,
} from "react-icons/fa";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { useProposals } from "@/hooks/proposal";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { useToast } from "@/components/ui/ToastProvider";
import CustomDropdown from "@/components/ui/CustomDropdown";
import { STATUSES } from "@/components/Filters";
import { supabase } from "@/lib/supabase";

type ClientDetail = {
	key: string;
	name: string;
	email: string;
	country: string;
	profileId?: number;
	proposalIds: number[];
	proposals: {
		id: number;
		title: string;
		status: string;
		followUpAt: string;
		dateSent: string;
	}[];
	socials: {
		linkedin: string;
		twitter: string;
		upwork: string;
		website: string;
		chat: string;
	};
};

type ManualClientProfile = {
	id: number;
	name: string;
	email: string;
	country: string;
	chatLink: string;
};

function normalizeLink(raw: string) {
	if (!raw) return "";
	if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
	return `https://${raw}`;
}

function getInitials(name: string) {
	return name
		.split(" ")
		.slice(0, 2)
		.map((w) => w[0]?.toUpperCase() ?? "")
		.join("");
}

export default function ClientsPage() {
	const { session } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const { proposals, loading, updateProposal, deleteProposal } = useProposals(
		session?.user?.id,
	);
	const { confirm } = useConfirm();
	const { toast } = useToast();
	const [selectedClientKey, setSelectedClientKey] = useState("");
	const [bulkStatus, setBulkStatus] = useState<string>("Sent");
	const [bulkFollowAt, setBulkFollowAt] = useState("");
	const [mobileShowDetail, setMobileShowDetail] = useState(false);
	const [addClientOpen, setAddClientOpen] = useState(false);
	const [newClientName, setNewClientName] = useState("");
	const [newClientEmail, setNewClientEmail] = useState("");
	const [newClientCountry, setNewClientCountry] = useState("");
	const [newClientChatLink, setNewClientChatLink] = useState("");
	const [savingClient, setSavingClient] = useState(false);
	const [manualClients, setManualClients] = useState<ManualClientProfile[]>([]);
	const [manualLoading, setManualLoading] = useState(false);
	const [chatLinkInput, setChatLinkInput] = useState("");
	const [savingChatLink, setSavingChatLink] = useState(false);

	useEffect(() => {
		if (session) return;
		router.replace(`/?next=${encodeURIComponent(pathname || "/clients")}`);
	}, [session, router, pathname]);

	useEffect(() => {
		if (!session?.user?.id) {
			setManualClients([]);
			return;
		}

		let active = true;
		const fetchManualClients = async () => {
			setManualLoading(true);
			const { data, error } = await supabase
				.from("client_profiles")
				.select("id, name, email, country, chat_link")
				.eq("user_id", session.user.id)
				.order("id", { ascending: false });

			if (!active) return;
			if (error) {
				toast(error.message || "Unable to load manual clients.", "error");
				setManualLoading(false);
				return;
			}

			const rows = ((data as Array<Record<string, unknown>> | null) ?? []).map(
				(row) => ({
					id: Number(row.id ?? 0),
					name: String(row.name ?? ""),
					email: String(row.email ?? ""),
					country: String(row.country ?? ""),
					chatLink: String(row.chat_link ?? ""),
				}),
			);
			setManualClients(rows);
			setManualLoading(false);
		};

		void fetchManualClients();
		return () => {
			active = false;
		};
	}, [session?.user?.id, toast]);

	const clients = useMemo<ClientDetail[]>(() => {
		const map: Record<string, ClientDetail> = {};

		proposals.forEach((p) => {
			const hasClientIdentity =
				Boolean(p.clientEmail?.trim()) ||
				Boolean(p.clientName?.trim()) ||
				Boolean(p.socials?.chat?.trim()) ||
				Boolean(p.socials?.linkedin?.trim()) ||
				Boolean(p.socials?.twitter?.trim()) ||
				Boolean(p.socials?.website?.trim()) ||
				Boolean(p.socials?.upwork?.trim());
			if (!hasClientIdentity) return;

			const key = (
				p.clientEmail ||
				p.clientName ||
				p.socials?.chat ||
				`client-${p.id}`
			).toLowerCase();
			if (!map[key]) {
				map[key] = {
					key,
					name: p.clientName || "Client",
					email: p.clientEmail || "",
					country: p.clientCountry || "",
					profileId: undefined,
					proposalIds: [],
					proposals: [],
					socials: {
						linkedin: "",
						twitter: "",
						upwork: "",
						website: "",
						chat: "",
					},
				};
			}
			map[key].proposalIds.push(p.id);
			map[key].proposals.push({
				id: p.id,
				title: p.jobTitle || `Proposal #${p.id}`,
				status: p.status,
				followUpAt: p.followUpAt,
				dateSent: p.dateSent,
			});
			map[key].socials.linkedin ||= p.socials?.linkedin || "";
			map[key].socials.twitter ||= p.socials?.twitter || "";
			map[key].socials.upwork ||= p.socials?.upwork || "";
			map[key].socials.website ||= p.socials?.website || "";
			map[key].socials.chat ||= p.socials?.chat || "";
		});

		for (const c of manualClients) {
			const key = (c.email || c.name || `client-profile-${c.id}`).toLowerCase();
			if (!map[key]) {
				map[key] = {
					key,
					name: c.name || "Unknown Client",
					email: c.email || "",
					country: c.country || "",
					profileId: c.id,
					proposalIds: [],
					proposals: [],
					socials: {
						linkedin: "",
						twitter: "",
						upwork: "",
						website: "",
						chat: c.chatLink || "",
					},
				};
				continue;
			}

			map[key].profileId ||= c.id;
			if (!map[key].email && c.email) map[key].email = c.email;
			if (!map[key].country && c.country) map[key].country = c.country;
			if (!map[key].name && c.name) map[key].name = c.name;
			if (!map[key].socials.chat && c.chatLink)
				map[key].socials.chat = c.chatLink;
		}

		return Object.values(map).sort((a, b) => {
			if (b.proposalIds.length !== a.proposalIds.length)
				return b.proposalIds.length - a.proposalIds.length;
			return a.name.localeCompare(b.name);
		});
	}, [manualClients, proposals]);

	const selected = useMemo(
		() =>
			clients.find((c) => c.key === selectedClientKey) ?? clients[0] ?? null,
		[clients, selectedClientKey],
	);

	useEffect(() => {
		setChatLinkInput(selected?.socials.chat || "");
	}, [selected?.key, selected?.socials.chat]);

	const handleSelectClient = (key: string) => {
		setSelectedClientKey(key);
		setMobileShowDetail(true);
	};

	const setStatusForClient = async () => {
		if (!selected) return;
		if (!selected.proposalIds.length) {
			toast("No proposals linked to this client.", "error");
			return;
		}
		for (const id of selected.proposalIds)
			await updateProposal(id, "status", bulkStatus);
		toast("Status updated for client proposals.", "success");
	};

	const scheduleForClient = async () => {
		if (!selected || !bulkFollowAt) {
			toast("Select follow-up date/time first.", "error");
			return;
		}
		if (!selected.proposalIds.length) {
			toast("No proposals linked to this client.", "error");
			return;
		}
		for (const id of selected.proposalIds)
			await updateProposal(id, "followUpAt", bulkFollowAt);
		toast("Follow-up scheduled for client.", "success");
	};

	const deleteClient = async () => {
		if (!selected) return;
		const ok = await confirm(
			selected.proposalIds.length
				? "This will delete all proposals under this client."
				: "This will delete the manually added client record.",
			selected.proposalIds.length
				? "Delete client and proposals?"
				: "Delete manual client?",
		);
		if (!ok) return;

		if (selected.profileId) {
			const { error } = await supabase
				.from("client_profiles")
				.delete()
				.eq("id", selected.profileId);
			if (error) {
				toast(error.message || "Unable to delete client profile.", "error");
				return;
			}
			setManualClients((curr) =>
				curr.filter((c) => c.id !== selected.profileId),
			);
		}

		for (const id of selected.proposalIds) await deleteProposal(id);
		toast(
			selected.proposalIds.length
				? "Client proposals deleted."
				: "Client deleted.",
			"success",
		);
		setMobileShowDetail(false);
	};

	const addClientManually = async () => {
		const name = newClientName.trim();
		const email = newClientEmail.trim();
		const country = newClientCountry.trim();
		const chatLink = newClientChatLink.trim();

		if (!name) {
			toast("Client name is required.", "error");
			return;
		}
		if (!session?.user?.id) {
			toast("You must be signed in.", "error");
			return;
		}

		setSavingClient(true);
		const { data, error } = await supabase
			.from("client_profiles")
			.insert([
				{ user_id: session.user.id, name, email, country, chat_link: chatLink },
			])
			.select("id, name, email, country, chat_link")
			.single();
		setSavingClient(false);

		if (error || !data) {
			toast(error?.message || "Unable to add client.", "error");
			return;
		}

		const manualClient = {
			id: Number((data as Record<string, unknown>).id ?? 0),
			name: String((data as Record<string, unknown>).name ?? ""),
			email: String((data as Record<string, unknown>).email ?? ""),
			country: String((data as Record<string, unknown>).country ?? ""),
			chatLink: String((data as Record<string, unknown>).chat_link ?? ""),
		};
		setManualClients((curr) => [manualClient, ...curr]);

		const nextKey = (email || name).toLowerCase();
		setSelectedClientKey(nextKey);
		setMobileShowDetail(true);
		setAddClientOpen(false);
		setNewClientName("");
		setNewClientEmail("");
		setNewClientCountry("");
		setNewClientChatLink("");
		toast("Client added.", "success");
	};

	const saveChatLink = async () => {
		if (!selected || !session?.user?.id) return;
		const nextLink = chatLinkInput.trim();
		setSavingChatLink(true);

		if (selected.profileId) {
			const { error } = await supabase
				.from("client_profiles")
				.update({ chat_link: nextLink })
				.eq("id", selected.profileId)
				.eq("user_id", session.user.id);
			setSavingChatLink(false);
			if (error) {
				toast(error.message || "Unable to save chat link.", "error");
				return;
			}
			setManualClients((curr) =>
				curr.map((c) =>
					c.id === selected.profileId ? { ...c, chatLink: nextLink } : c,
				),
			);
			toast("Chat link saved.", "success");
			return;
		}

		const { data, error } = await supabase
			.from("client_profiles")
			.insert([
				{
					user_id: session.user.id,
					name: selected.name || "",
					email: selected.email || "",
					country: selected.country || "",
					chat_link: nextLink,
				},
			])
			.select("id, name, email, country, chat_link")
			.single();
		setSavingChatLink(false);
		if (error || !data) {
			toast(error?.message || "Unable to save chat link.", "error");
			return;
		}

		setManualClients((curr) => [
			{
				id: Number((data as Record<string, unknown>).id ?? 0),
				name: String((data as Record<string, unknown>).name ?? ""),
				email: String((data as Record<string, unknown>).email ?? ""),
				country: String((data as Record<string, unknown>).country ?? ""),
				chatLink: String((data as Record<string, unknown>).chat_link ?? ""),
			},
			...curr,
		]);
		toast("Chat link saved.", "success");
	};

	if (!session) return null;

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

        .cp-layout {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 12px;
          align-items: start;
        }

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

        .cp-empty {
          color: var(--muted);
          font-size: 13px;
          padding: 8px 0;
        }

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

			<div
				style={{
					minHeight: "100vh",
					background: "var(--bg)",
					color: "var(--text)",
				}}
			>
				<AppHeader />
				<main className="cp-main">
					<section className="cp-hero">
						<div
							style={{
								display: "flex",
								alignItems: "flex-start",
								justifyContent: "space-between           ",
								gap: 10,
								flexWrap: "wrap",
							}}
						>
							<div>
								<h1>Clients</h1>
								<p>Select a client to open details and run actions.</p>
							</div>
							<button
								onClick={() => setAddClientOpen(true)}
								className="cp-action-btn"
								style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
							>
								<FaUserPlus size={12} /> Add Client
							</button>
						</div>
					</section>

					{loading || manualLoading ? (
						<div className="cp-empty">Loading clients...</div>
					) : (
						<section className="cp-layout">
							<div
								className={`cp-sidebar${mobileShowDetail ? " mobile-hidden" : ""}`}
							>
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
												<div className="cp-client-meta">
													{c.email || "No email"}
												</div>
											</div>
											<div className="cp-proposal-badge">
												{c.proposalIds.length}
											</div>
										</button>
									))}
									{clients.length === 0 && (
										<div className="cp-empty">No clients yet.</div>
									)}
								</div>
							</div>

							<div
								className={`cp-detail${!mobileShowDetail ? " mobile-hidden" : ""}`}
								style={{
									display: !selected && !mobileShowDetail ? "none" : undefined,
								}}
							>
								<button
									className="cp-back-btn"
									onClick={() => setMobileShowDetail(false)}
								>
									<FaChevronLeft size={11} /> All Clients
								</button>

								{!selected && (
									<div className="cp-empty">
										Select a client to view details.
									</div>
								)}

								{selected && (
									<>
										<div className="cp-detail-header">
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: 12,
												}}
											>
												<div className="cp-detail-avatar">
													{getInitials(selected.name)}
												</div>
												<div>
													<div className="cp-detail-name">
														{selected.socials.chat ? (
															<a
																href={normalizeLink(selected.socials.chat)}
																target="_blank"
																rel="noreferrer"
																style={{
																	color: "var(--text)",
																	textDecoration: "underline",
																	textDecorationColor: "transparent",
																	textUnderlineOffset: 4,
																}}
															>
																{selected.name}{" "}
																<FaExternalLinkAlt
																	size={10}
																	style={{ verticalAlign: "middle" }}
																/>
															</a>
														) : (
															selected.name
														)}
													</div>
													<div className="cp-detail-sub">
														{selected.email || "No email"}
														{selected.country ? ` � ${selected.country}` : ""}
													</div>
												</div>
											</div>
											<button
												onClick={() => void deleteClient()}
												className="cp-danger-btn"
											>
												<FaTrash size={12} /> Delete Client
											</button>
										</div>

										<div className="cp-socials">
											{selected.socials.chat && (
												<a
													href={normalizeLink(selected.socials.chat)}
													target="_blank"
													rel="noreferrer"
													className="cp-chip"
												>
													<FaComments size={12} /> Chat
												</a>
											)}
											{selected.socials.linkedin && (
												<a
													href={normalizeLink(selected.socials.linkedin)}
													target="_blank"
													rel="noreferrer"
													className="cp-chip"
												>
													<FaLinkedin size={12} /> LinkedIn
												</a>
											)}
											{selected.socials.twitter && (
												<a
													href={normalizeLink(selected.socials.twitter)}
													target="_blank"
													rel="noreferrer"
													className="cp-chip"
												>
													<FaTwitter size={12} /> Twitter
												</a>
											)}
											{selected.socials.website && (
												<a
													href={normalizeLink(selected.socials.website)}
													target="_blank"
													rel="noreferrer"
													className="cp-chip"
												>
													<FaGlobe size={12} /> Website
												</a>
											)}
											{selected.email && (
												<a
													href={`mailto:${selected.email}`}
													className="cp-chip"
												>
													<FaEnvelope size={12} /> Email
												</a>
											)}
										</div>

										<div className="cp-bulk">
											<div className="cp-bulk-label">Client Chat Link</div>
											<div className="cp-bulk-row">
												<input
													type="url"
													value={chatLinkInput}
													onChange={(e) => setChatLinkInput(e.target.value)}
													placeholder="https://chat-link.com"
													className="cp-input"
												/>
												<button
													onClick={() => void saveChatLink()}
													className="cp-action-btn"
													disabled={savingChatLink}
													style={{ opacity: savingChatLink ? 0.7 : 1 }}
												>
													{savingChatLink ? "Saving..." : "Save Link"}
												</button>
											</div>
										</div>

										<div className="cp-bulk">
											<div className="cp-bulk-label">Bulk Actions</div>
											{selected.proposalIds.length ? (
												<>
													<div className="cp-bulk-row">
														<CustomDropdown
															value={bulkStatus}
															onChange={setBulkStatus}
															options={STATUSES.map((s) => ({
																value: s,
																label: s,
															}))}
															width={180}
															placeholder="Set status"
														/>
														<button
															onClick={() => void setStatusForClient()}
															className="cp-action-btn"
														>
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
														<button
															onClick={() => void scheduleForClient()}
															className="cp-action-btn"
														>
															Schedule Follow Up
														</button>
													</div>
												</>
											) : (
												<div className="cp-empty" style={{ padding: 0 }}>
													No proposals linked yet. Add proposals for this client
													from Home.
												</div>
											)}
										</div>

										<div className="cp-table-wrap">
											<table className="cp-table">
												<thead>
													<tr>
														{[
															"Proposal",
															"Status",
															"Date Sent",
															"Follow Up",
														].map((h) => (
															<th key={h}>{h}</th>
														))}
													</tr>
												</thead>
												<tbody>
													{selected.proposals.length ? (
														selected.proposals.map((p) => (
															<tr key={p.id}>
																<td
																	style={{
																		maxWidth: 240,
																		overflow: "hidden",
																		textOverflow: "ellipsis",
																		whiteSpace: "nowrap",
																	}}
																>
																	{p.title}
																</td>
																<td>
																	<span className="cp-status-pill">
																		{p.status}
																	</span>
																</td>
																<td style={{ whiteSpace: "nowrap" }}>
																	{p.dateSent}
																</td>
																<td
																	style={{
																		whiteSpace: "nowrap",
																		color: "var(--muted)",
																	}}
																>
																	{p.followUpAt
																		? new Date(p.followUpAt).toLocaleString()
																		: "-"}
																</td>
															</tr>
														))
													) : (
														<tr>
															<td colSpan={4} style={{ color: "var(--muted)" }}>
																No proposals linked to this client yet.
															</td>
														</tr>
													)}
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

			{addClientOpen && (
				<div
					style={{
						position: "fixed",
						inset: 0,
						background: "rgba(0,0,0,0.58)",
						display: "grid",
						placeItems: "center",
						zIndex: 160,
						padding: 16,
					}}
				>
					<div
						style={{
							width: "100%",
							maxWidth: 460,
							background: "var(--bg-soft)",
							border: "1px solid var(--border)",
							borderRadius: 14,
							padding: 16,
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: 12,
							}}
						>
							<div style={{ fontSize: 18, fontWeight: 800 }}>
								Add Client Manually
							</div>
							<button
								onClick={() => setAddClientOpen(false)}
								style={{
									background: "transparent",
									border: "1px solid var(--border)",
									color: "var(--muted)",
									borderRadius: 8,
									padding: "4px 8px",
									cursor: "pointer",
								}}
							>
								X
							</button>
						</div>

						<div style={{ display: "grid", gap: 10 }}>
							<div>
								<label
									style={{
										display: "block",
										fontSize: 11,
										color: "var(--muted)",
										textTransform: "uppercase",
										letterSpacing: "0.08em",
										marginBottom: 6,
									}}
								>
									Name
								</label>
								<input
									value={newClientName}
									onChange={(e) => setNewClientName(e.target.value)}
									placeholder="Client name"
									className="cp-input"
									style={{ width: "100%" }}
								/>
							</div>
							<div>
								<label
									style={{
										display: "block",
										fontSize: 11,
										color: "var(--muted)",
										textTransform: "uppercase",
										letterSpacing: "0.08em",
										marginBottom: 6,
									}}
								>
									Email (optional)
								</label>
								<input
									value={newClientEmail}
									onChange={(e) => setNewClientEmail(e.target.value)}
									type="email"
									placeholder="client@email.com"
									className="cp-input"
									style={{ width: "100%" }}
								/>
							</div>
							<div>
								<label
									style={{
										display: "block",
										fontSize: 11,
										color: "var(--muted)",
										textTransform: "uppercase",
										letterSpacing: "0.08em",
										marginBottom: 6,
									}}
								>
									Country (optional)
								</label>
								<input
									value={newClientCountry}
									onChange={(e) => setNewClientCountry(e.target.value)}
									placeholder="Country"
									className="cp-input"
									style={{ width: "100%" }}
								/>
							</div>
							<div>
								<label
									style={{
										display: "block",
										fontSize: 11,
										color: "var(--muted)",
										textTransform: "uppercase",
										letterSpacing: "0.08em",
										marginBottom: 6,
									}}
								>
									Chat Link (optional)
								</label>
								<input
									value={newClientChatLink}
									onChange={(e) => setNewClientChatLink(e.target.value)}
									type="url"
									placeholder="https://chat-link.com"
									className="cp-input"
									style={{ width: "100%" }}
								/>
							</div>
						</div>

						<div
							style={{
								display: "flex",
								justifyContent: "flex-end",
								gap: 8,
								marginTop: 14,
							}}
						>
							<button
								onClick={() => setAddClientOpen(false)}
								className="cp-danger-btn"
								style={{ color: "var(--muted)", borderColor: "var(--border)" }}
							>
								Cancel
							</button>
							<button
								onClick={() => void addClientManually()}
								className="cp-action-btn"
								disabled={savingClient}
								style={{ opacity: savingClient ? 0.7 : 1 }}
							>
								{savingClient ? "Adding..." : "Add Client"}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
