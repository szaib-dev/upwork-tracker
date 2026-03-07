"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Proposal } from "@/lib/types/proposal";
import { ShareAccessInfo } from "@/lib/types/share";
import DashboardStats from "@/components/analytics/DashboardStats";
import Insights from "@/components/analytics/Insights";
import Charts from "@/components/analytics/Charts";
import MonthDropdown from "@/components/MonthDropdown";
import Filters from "@/components/Filters";
import SharedProposalTable from "@/components/shared/SharedProposalTable";

function formatMonthLabel(month: string) {
	return new Date(`${month}-01`).toLocaleString("en-US", {
		month: "short",
		year: "numeric",
	});
}

function mapSharedRow(row: Record<string, unknown>): Proposal {
	return {
		id: Number(row.id ?? 0),
		userId: (row.user_id as string | null | undefined) ?? null,
		dateSent: String(row.date_sent ?? ""),
		jobTitle: String(row.job_title ?? ""),
		jobUrl: String(row.job_url ?? ""),
		budget: Number(row.budget ?? 0),
		connects: Number(row.connects ?? 0),
		boosted: Boolean(row.boosted),
		loom: Boolean(row.loom),
		viewed: Boolean(row.viewed),
		lead: Boolean(row.lead),
		status: String(row.status ?? "Sent") as Proposal["status"],
		replyDate: String(row.reply_date ?? ""),
		followUpAt: String(row.follow_up_at ?? ""),
		followUpTopic: String(row.follow_up_topic ?? ""),
		clientCountry: String(row.client_country ?? ""),
		clientName: String(row.client_name ?? ""),
		clientEmail: String(row.client_email ?? ""),
		proposalText: String(row.proposal_text ?? ""),
		socials:
			typeof row.socials === "object" && row.socials
				? (row.socials as Record<string, string>)
				: {},
		createdAt: (row.created_at as string | undefined) ?? undefined,
	};
}

export default function SharedAnalyticsPage() {
	const params = useParams<{ token: string }>();
	const token = params?.token || "";
	const { session } = useAuth();
	const [monthFilter, setMonthFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState<"All" | Proposal["status"]>(
		"All",
	);
	const [viewMode, setViewMode] = useState<"dashboard" | "analytics">(
		"dashboard",
	);
	const [access, setAccess] = useState<ShareAccessInfo | null>(null);
	const [proposals, setProposals] = useState<Proposal[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!token) return;
		const load = async () => {
			setLoading(true);
			setError(null);

			const { data: accessRows, error: accessError } = await supabase.rpc(
				"get_analytics_share_access",
				{ p_token: token },
			);
			if (
				accessError ||
				!Array.isArray(accessRows) ||
				accessRows.length === 0
			) {
				setError(accessError?.message || "Unable to validate share link.");
				setLoading(false);
				return;
			}

			const infoRow = accessRows[0] as Record<string, unknown>;
			const info: ShareAccessInfo = {
				shareExists: Boolean(infoRow.share_exists),
				visibility: (infoRow.visibility as "public" | "private" | null) ?? null,
				title: (infoRow.title as string | null) ?? null,
				canAccess: Boolean(infoRow.can_access),
			};
			setAccess(info);

			if (!info.shareExists || !info.canAccess) {
				setLoading(false);
				return;
			}

			const { data: rows, error: rowsError } = await supabase.rpc(
				"get_shared_proposals",
				{ p_token: token },
			);
			if (rowsError) {
				setError(rowsError.message);
				setLoading(false);
				return;
			}

			setProposals(
				((rows as Record<string, unknown>[] | null) ?? []).map(mapSharedRow),
			);
			setLoading(false);
		};

		void load();
	}, [token]);

	const monthOptions = useMemo(
		() =>
			Array.from(
				new Set(proposals.map((p) => p.dateSent.slice(0, 7)).filter(Boolean)),
			).sort((a, b) => b.localeCompare(a)),
		[proposals],
	);
	const monthSelectOptions = useMemo(
		() => [
			{ value: "all", label: "All months" },
			...monthOptions.map((m) => ({ value: m, label: formatMonthLabel(m) })),
		],
		[monthOptions],
	);

	const monthFiltered = useMemo(() => {
		return proposals.filter(
			(p) => monthFilter === "all" || p.dateSent.startsWith(monthFilter),
		);
	}, [proposals, monthFilter]);

	const filtered = useMemo(() => {
		return monthFiltered.filter(
			(p) => statusFilter === "All" || p.status === statusFilter,
		);
	}, [monthFiltered, statusFilter]);

	if (loading) {
		return (
			<div style={fullPage}>
				<div style={{ color: "var(--muted)" }}>Loading shared analytics...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div style={fullPage}>
				<div style={panel}>
					<div style={{ fontWeight: 700, marginBottom: 6 }}>Error</div>
					<div style={{ color: "var(--muted)", marginBottom: 10 }}>{error}</div>
					<Link href="/" style={linkBtn}>
						Go Home
					</Link>
				</div>
			</div>
		);
	}

	if (!access?.shareExists) {
		return (
			<div style={fullPage}>
				<div style={panel}>
					<div style={{ fontWeight: 700, marginBottom: 6 }}>Invalid Link</div>
					<div style={{ color: "var(--muted)", marginBottom: 10 }}>
						This shared analytics link does not exist.
					</div>
					<Link href="/" style={linkBtn}>
						Go Home
					</Link>
				</div>
			</div>
		);
	}

	if (!access.canAccess) {
		return (
			<div style={fullPage}>
				<div style={{ ...panel, maxWidth: 520 }}>
					<div style={{ fontWeight: 700, marginBottom: 6 }}>
						Access Restricted
					</div>
					<div style={{ color: "var(--muted)", marginBottom: 8 }}>
						This is a private share. Sign in with an allowed email to view it.
					</div>
					<div
						style={{ color: "var(--muted)", fontSize: 12, marginBottom: 12 }}
					>
						Current session: {session?.user?.email || "Not signed in"}
					</div>
					<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
						<Link href="/" style={linkBtn}>
							Email Sign In
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			style={{
				background: "var(--bg)",
				minHeight: "100vh",
				color: "var(--text)",
			}}
		>
			<div
				style={{
					borderBottom: "1px solid var(--border)",
					padding: "10px 12px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: 10,
					flexWrap: "wrap",
				}}
			>
				<div>
					<div style={{ fontSize: 20, fontWeight: 800 }}>Shared Analytics</div>
					<div style={{ fontSize: 12, color: "var(--muted)" }}>
						{access.title || "Team Analytics"}
					</div>
				</div>
				<Link href="/" style={linkBtn}>
					Open App
				</Link>
			</div>

			<div style={{ padding: "12px 14px" }}>
				<div
					style={{
						background: "var(--bg-soft)",
						border: "1px solid var(--border)",
						borderRadius: 12,
						padding: 12,
						marginBottom: 12,
						display: "flex",
						gap: 8,
						alignItems: "center",
						flexWrap: "wrap",
					}}
				>
					<button
						onClick={() => setViewMode("dashboard")}
						style={toggleBtn(viewMode === "dashboard")}
					>
						Dashboard
					</button>
					<button
						onClick={() => setViewMode("analytics")}
						style={toggleBtn(viewMode === "analytics")}
					>
						Analytics
					</button>
				</div>

				<div
					style={{
						background: "var(--bg-soft)",
						border: "1px solid var(--border)",
						borderRadius: 12,
						padding: 12,
						marginBottom: 12,
					}}
				>
					<label
						style={{ fontSize: 11, color: "var(--muted)", marginRight: 8 }}
					>
						Month:
					</label>
					<div style={{ marginTop: 8 }}>
						<MonthDropdown
							value={monthFilter}
							onChange={setMonthFilter}
							options={monthSelectOptions}
							width={260}
						/>
					</div>
				</div>

				{viewMode === "dashboard" ? (
					<>
						<DashboardStats proposals={filtered} />
						<Filters
							currentFilter={statusFilter}
							setFilter={setStatusFilter}
							proposals={monthFiltered}
						/>
						<SharedProposalTable proposals={filtered} />
					</>
				) : (
					<>
						<DashboardStats proposals={filtered} />
						<Insights proposals={filtered} />
						<Charts proposals={filtered} />
					</>
				)}
			</div>
		</div>
	);
}

const fullPage: React.CSSProperties = {
	minHeight: "100vh",
	background: "var(--bg)",
	color: "var(--text)",
	display: "grid",
	placeItems: "center",
	padding: 16,
};

const panel: React.CSSProperties = {
	background: "var(--bg-soft)",
	border: "1px solid var(--border)",
	borderRadius: 12,
	padding: 16,
	width: "100%",
	maxWidth: 420,
};

const linkBtn: React.CSSProperties = {
	display: "inline-flex",
	alignItems: "center",
	gap: 6,
	background: "var(--bg-elev)",
	border: "1px solid var(--border)",
	borderRadius: 9,
	color: "var(--text)",
	padding: "8px 10px",
	textDecoration: "none",
	fontSize: 13,
	cursor: "pointer",
};

function toggleBtn(active: boolean): React.CSSProperties {
	return {
		background: active ? "var(--primary-soft)" : "var(--bg-elev)",
		border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
		color: active ? "var(--primary)" : "var(--text)",
		borderRadius: 9,
		padding: "8px 12px",
		fontSize: 12,
		cursor: "pointer",
	};
}
