"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
	FaCalendarPlus,
	FaTrash,
	FaClock,
	FaExclamationCircle,
	FaCalendarAlt,
	FaRegComments,
} from "react-icons/fa";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { useProposals } from "@/hooks/proposal";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { useToast } from "@/components/ui/ToastProvider";

type ClientItem = {
	key: string;
	name: string;
	email: string;
	proposals: number[];
	nextFollow: Date | null;
	nextTopic: string;
};

export default function FollowUpPage() {
	const { session } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const { proposals, loading, updateProposal } = useProposals(
		session?.user?.id,
	);
	const { confirm } = useConfirm();
	const { toast } = useToast();
	const [nowTs, setNowTs] = useState(() => Date.now());
	const [open, setOpen] = useState(false);

	// Modal State
	const [clientName, setClientName] = useState("");
	const [followAt, setFollowAt] = useState("");
	const [topic, setTopic] = useState("");

	useEffect(() => {
		if (session) return;
		router.replace(`/?next=${encodeURIComponent(pathname || "/follow-up")}`);
	}, [session, router, pathname]);

	// Update time every minute to keep "overdue" / "due in 24h" calculations fresh
	useEffect(() => {
		const timer = setInterval(() => setNowTs(Date.now()), 60000);
		return () => clearInterval(timer);
	}, []);

	const clients = useMemo<ClientItem[]>(() => {
		const map: Record<string, ClientItem> = {};
		for (const p of proposals) {
			const key = (
				p.clientEmail ||
				p.clientName ||
				`client-${p.id}`
			).toLowerCase();
			if (!map[key]) {
				map[key] = {
					key,
					name: p.clientName || "Unknown Client",
					email: p.clientEmail || "",
					proposals: [],
					nextFollow: null,
					nextTopic: "",
				};
			}
			map[key].proposals.push(p.id);
			if (p.followUpAt) {
				const dt = new Date(p.followUpAt);
				if (
					!map[key].nextFollow ||
					dt.getTime() < map[key].nextFollow.getTime()
				) {
					map[key].nextFollow = dt;
					map[key].nextTopic = p.followUpTopic || "";
				}
			}
		}
		return Object.values(map).sort((a, b) => {
			const aTs = a.nextFollow?.getTime() ?? Number.MAX_SAFE_INTEGER;
			const bTs = b.nextFollow?.getTime() ?? Number.MAX_SAFE_INTEGER;
			return aTs - bTs;
		});
	}, [proposals]);

	const scheduled = useMemo(
		() => clients.filter((c) => c.nextFollow),
		[clients],
	);

	// Grouped logic for better UI rendering
	const { groups, summary } = useMemo(() => {
		const grouped = {
			overdue: [] as ClientItem[],
			due24: [] as ClientItem[],
			upcoming: [] as ClientItem[],
		};

		let overdueCount = 0,
			due24Count = 0,
			upcomingCount = 0;

		for (const c of scheduled) {
			const diff = (c.nextFollow as Date).getTime() - nowTs;
			if (diff < 0) {
				overdueCount += 1;
				grouped.overdue.push(c);
			} else if (diff <= 24 * 60 * 60 * 1000) {
				due24Count += 1;
				grouped.due24.push(c);
			} else {
				upcomingCount += 1;
				grouped.upcoming.push(c);
			}
		}
		return {
			groups: grouped,
			summary: {
				total: scheduled.length,
				overdue: overdueCount,
				due24: due24Count,
				upcoming: upcomingCount,
			},
		};
	}, [scheduled, nowTs]);

	const saveFollowUp = async () => {
		if (!clientName.trim() || !followAt) {
			toast("Enter client name and date/time.", "error");
			return;
		}
		const name = clientName.trim().toLowerCase();
		const targets = clients.filter((c) => c.name.toLowerCase().includes(name));
		if (!targets.length) {
			toast("No client matched that name.", "error");
			return;
		}
		for (const c of targets) {
			for (const id of c.proposals) {
				await updateProposal(id, "followUpAt", followAt);
				await updateProposal(id, "followUpTopic", topic);
			}
		}
		toast(`Follow-up scheduled for ${targets.length} client(s).`, "success");
		setOpen(false);
		setClientName("");
		setFollowAt("");
		setTopic("");
	};

	const removeFollowUp = async (client: ClientItem) => {
		const ok = await confirm(
			`Remove follow-up schedule for ${client.name}?`,
			"Delete follow-up?",
		);
		if (!ok) return;
		for (const id of client.proposals) {
			await updateProposal(id, "followUpAt", "");
			await updateProposal(id, "followUpTopic", "");
		}
		toast("Follow-up schedule removed.", "success");
	};

	if (!session) return null;

	return (
		<div
			style={{
				minHeight: "100vh",
				background: "var(--bg)",
				color: "var(--text)",
				fontFamily: "Inter, sans-serif",
			}}
		>
			<AppHeader />
			<main
				style={{
					width: "100%",
					maxWidth: 1000,
					margin: "0 auto",
					padding: "24px 20px",
					display: "grid",
					gap: 24,
				}}
			>
				{/* Header Section */}
				<section
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-end",
						flexWrap: "wrap",
						gap: 16,
					}}
				>
					<div>
						<h1
							style={{
								margin: 0,
								fontSize: 32,
								fontWeight: 850,
								letterSpacing: "-0.02em",
							}}
						>
							Follow Ups
						</h1>
						<div style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
							Manage your proposal timelines and client touchpoints.
						</div>
					</div>
					<button
						onClick={() => setOpen(true)}
						style={primaryBtn}
						className="fx-btn fx-btn-primary"
					>
						<FaCalendarPlus /> Schedule Follow Up
					</button>
				</section>

				{/* Summary Cards */}
				<section
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
						gap: 16,
					}}
				>
					<SummaryCard
						label="Total Scheduled"
						value={summary.total}
						icon={<FaCalendarAlt size={20} />}
					/>
					<SummaryCard
						label="Due in 24h"
						value={summary.due24}
						accent="var(--primary)"
						icon={<FaClock size={20} />}
					/>
					<SummaryCard
						label="Overdue"
						value={summary.overdue}
						accent="#ff4d4f"
						icon={<FaExclamationCircle size={20} />}
					/>
				</section>

				{/* Main List Area */}
				<section style={{ ...panel, padding: "24px" }}>
					{loading ? (
						<div
							style={{
								padding: 40,
								textAlign: "center",
								color: "var(--muted)",
							}}
						>
							Loading follow-up schedules...
						</div>
					) : scheduled.length === 0 ? (
						<div
							style={{
								border: "1px dashed var(--border)",
								borderRadius: 16,
								background: "var(--bg-elev)",
								padding: 40,
								color: "var(--muted)",
								textAlign: "center",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: 12,
							}}
						>
							<FaCalendarAlt size={32} style={{ opacity: 0.5 }} />
							<div style={{ fontSize: 16, fontWeight: 500 }}>
								No follow-ups scheduled
							</div>
							<div style={{ fontSize: 14 }}>
								Keep track of your leads by scheduling your next touchpoint.
							</div>
						</div>
					) : (
						<div style={{ display: "grid", gap: 32 }}>
							{/* Group: Overdue */}
							{groups.overdue.length > 0 && (
								<FollowUpGroup
									title="Overdue"
									items={groups.overdue}
									type="danger"
									onRemove={removeFollowUp}
								/>
							)}

							{/* Group: Due within 24 Hours */}
							{groups.due24.length > 0 && (
								<FollowUpGroup
									title="Due within 24 Hours"
									items={groups.due24}
									type="warning"
									onRemove={removeFollowUp}
								/>
							)}

							{/* Group: Upcoming */}
							{groups.upcoming.length > 0 && (
								<FollowUpGroup
									title="Upcoming"
									items={groups.upcoming}
									type="neutral"
									onRemove={removeFollowUp}
								/>
							)}
						</div>
					)}
				</section>
			</main>

			{/* Modernized Modal */}
			{open && (
				<div
					style={{
						position: "fixed",
						inset: 0,
						background: "rgba(0,0,0,0.6)",
						backdropFilter: "blur(4px)",
						display: "grid",
						placeItems: "center",
						padding: 20,
						zIndex: 120,
					}}
				>
					<div
						style={{
							width: "100%",
							maxWidth: 480,
							background: "var(--bg-soft)",
							border: "1px solid var(--border)",
							borderRadius: 20,
							padding: 24,
							boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
						}}
					>
						<h2 style={{ margin: "0 0 8px 0", fontSize: 22, fontWeight: 800 }}>
							Schedule Follow Up
						</h2>
						<p
							style={{
								margin: "0 0 20px 0",
								color: "var(--muted)",
								fontSize: 14,
							}}
						>
							Apply a follow-up date and topic to all proposals for a specific
							client.
						</p>

						<div style={{ display: "grid", gap: 16 }}>
							<div>
								<label style={labelStyle}>Client Name</label>
								<input
									value={clientName}
									onChange={(e) => setClientName(e.target.value)}
									placeholder="e.g. Acme Corp"
									style={fieldStyle}
									className="fx-input"
								/>
							</div>
							<div>
								<label style={labelStyle}>Date & Time</label>
								<input
									type="datetime-local"
									value={followAt}
									onChange={(e) => setFollowAt(e.target.value)}
									style={fieldStyle}
									className="fx-input"
								/>
							</div>
							<div>
								<label style={labelStyle}>Discussion Topic (Optional)</label>
								<div style={{ position: "relative" }}>
									<FaRegComments
										style={{
											position: "absolute",
											left: 14,
											top: "50%",
											transform: "translateY(-50%)",
											color: "var(--muted)",
										}}
									/>
									<input
										value={topic}
										onChange={(e) => setTopic(e.target.value)}
										placeholder="e.g. Contract review..."
										style={{ ...fieldStyle, paddingLeft: 40 }}
										className="fx-input"
									/>
								</div>
							</div>

							<div
								style={{
									display: "flex",
									justifyContent: "flex-end",
									gap: 12,
									marginTop: 8,
								}}
							>
								<button
									onClick={() => setOpen(false)}
									style={ghostBtn}
									className="fx-btn fx-btn-ghost"
								>
									Cancel
								</button>
								<button
									onClick={() => void saveFollowUp()}
									style={primaryBtn}
									className="fx-btn fx-btn-primary"
								>
									Save Schedule
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			<style>{`
        .fx-btn { transition: all 0.2s ease; }
        .fx-btn:hover { transform: translateY(-1px); filter: brightness(1.05); }
        .fx-btn:active { transform: translateY(0); }
        .fx-btn-primary:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
        
        .fx-card { transition: all 0.2s ease; }
        .fx-card:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0, 0, 0, 0.04); }
        
        .fx-input { transition: all 0.2s ease; width: 100%; box-sizing: border-box; }
        .fx-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent); outline: none; }
      `}</style>
		</div>
	);
}

// --- Helper Components ---

function SummaryCard({
	label,
	value,
	accent = "var(--text)",
	icon,
}: {
	label: string;
	value: number;
	accent?: string;
	icon: React.ReactNode;
}) {
	return (
		<div
			style={{
				background: "var(--bg-soft)",
				border: "1px solid var(--border)",
				borderRadius: 16,
				padding: "20px",
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
			}}
		>
			<div>
				<div
					style={{
						fontSize: 32,
						fontWeight: 800,
						color: accent,
						lineHeight: 1,
						marginBottom: 6,
					}}
				>
					{value}
				</div>
				<div
					style={{
						fontSize: 12,
						color: "var(--muted)",
						textTransform: "uppercase",
						letterSpacing: "0.05em",
						fontWeight: 600,
					}}
				>
					{label}
				</div>
			</div>
			<div
				style={{
					color: accent,
					opacity: 0.8,
					background: `color-mix(in srgb, ${accent} 10%, transparent)`,
					padding: 12,
					borderRadius: 12,
				}}
			>
				{icon}
			</div>
		</div>
	);
}

function FollowUpGroup({
	title,
	items,
	type,
	onRemove,
}: {
	title: string;
	items: ClientItem[];
	type: "danger" | "warning" | "neutral";
	onRemove: (c: ClientItem) => void;
}) {
	const typeColors = {
		danger: "#ff4d4f",
		warning: "var(--primary)",
		neutral: "var(--muted)",
	};
	const color = typeColors[type];

	return (
		<div>
			<h3
				style={{
					fontSize: 14,
					textTransform: "uppercase",
					letterSpacing: "0.05em",
					color,
					marginBottom: 12,
					display: "flex",
					alignItems: "center",
					gap: 8,
				}}
			>
				<span
					style={{
						width: 8,
						height: 8,
						borderRadius: "50%",
						background: color,
					}}
				></span>
				{title} ({items.length})
			</h3>
			<div style={{ display: "grid", gap: 12 }}>
				{items.map((c) => {
					const next = c.nextFollow as Date;
					return (
						<article
							key={c.key}
							style={{
								border: "1px solid var(--border)",
								borderLeft: `4px solid ${color}`,
								background: "var(--bg-elev)",
								borderRadius: 12,
								padding: 16,
							}}
							className="fx-card"
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									gap: 16,
									flexWrap: "wrap",
								}}
							>
								{/* Client Info with Avatar */}
								<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
									<div style={avatarStyle}>
										{c.name[0]?.toUpperCase() || "?"}
									</div>
									<div>
										<div style={{ fontWeight: 700, fontSize: 16 }}>
											{c.name}
										</div>
										<div
											style={{
												color: "var(--muted)",
												fontSize: 13,
												marginTop: 2,
											}}
										>
											{c.email || "No email"} • {c.proposals.length} proposal(s)
										</div>
									</div>
								</div>

								{/* Date & Action */}
								<div style={{ display: "flex", alignItems: "center", gap: 24 }}>
									<div style={{ textAlign: "right" }}>
										<div
											style={{
												fontSize: 14,
												fontWeight: 600,
												color: "var(--text)",
											}}
										>
											{next.toLocaleDateString(undefined, {
												weekday: "short",
												month: "short",
												day: "numeric",
											})}
										</div>
										<div style={{ fontSize: 13, color: color, marginTop: 2 }}>
											{next.toLocaleTimeString(undefined, {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</div>
									</div>
									<button
										onClick={() => void onRemove(c)}
										style={iconBtn}
										title="Remove schedule"
										className="fx-btn"
									>
										<FaTrash size={14} />
									</button>
								</div>
							</div>

							{/* Topic Bubble */}
							{c.nextTopic && (
								<div
									style={{
										marginTop: 16,
										marginLeft: 50,
										padding: "10px 14px",
										background: "var(--bg)",
										borderRadius: 8,
										fontSize: 13,
										color: "var(--text)",
										border: "1px solid var(--border)",
										display: "inline-block",
									}}
								>
									<strong>Topic:</strong> {c.nextTopic}
								</div>
							)}
						</article>
					);
				})}
			</div>
		</div>
	);
}

// --- Styles ---

const panel: React.CSSProperties = {
	background: "var(--bg-soft)",
	border: "1px solid var(--border)",
	borderRadius: 16,
	boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
};
const fieldStyle: React.CSSProperties = {
	background: "var(--bg)",
	border: "1px solid var(--border)",
	borderRadius: 10,
	color: "var(--text)",
	padding: "12px 14px",
	fontSize: 14,
};
const labelStyle: React.CSSProperties = {
	display: "block",
	fontSize: 12,
	fontWeight: 600,
	color: "var(--text)",
	marginBottom: 6,
	textTransform: "uppercase",
	letterSpacing: "0.05em",
};

const primaryBtn: React.CSSProperties = {
	display: "inline-flex",
	alignItems: "center",
	gap: 8,
	background: "var(--text)",
	color: "var(--bg)",
	border: "none",
	borderRadius: 10,
	padding: "12px 16px",
	fontSize: 14,
	fontWeight: 600,
	cursor: "pointer",
};
const ghostBtn: React.CSSProperties = {
	background: "transparent",
	color: "var(--text)",
	border: "1px solid var(--border)",
	borderRadius: 10,
	padding: "12px 16px",
	fontSize: 14,
	fontWeight: 600,
	cursor: "pointer",
};
const iconBtn: React.CSSProperties = {
	background: "var(--bg)",
	border: "1px solid var(--border)",
	color: "var(--muted)",
	borderRadius: 8,
	padding: "10px",
	cursor: "pointer",
	display: "grid",
	placeItems: "center",
};

const avatarStyle: React.CSSProperties = {
	width: 38,
	height: 38,
	borderRadius: 10,
	background: "var(--primary)",
	color: "#fff",
	display: "grid",
	placeItems: "center",
	fontWeight: 700,
	flexShrink: 0,
	fontSize: 16,
};
