"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FaMoon, FaSignOutAlt, FaSun } from "react-icons/fa";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/lib/supabase";
import { Proposal } from "@/lib/types/proposal";
import { ShareAccessInfo } from "@/lib/types/share";
import MonthDropdown from "@/components/MonthDropdown";
import Filters from "@/components/Filters";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

const DashboardStats = dynamic(
	() => import("@/components/analytics/DashboardStats"),
	{
		loading: () => <CardSkeleton />,
	},
);
const Insights = dynamic(() => import("@/components/analytics/Insights"), {
	loading: () => <CardSkeleton />,
});
const Charts = dynamic(() => import("@/components/analytics/Charts"), {
	loading: () => <TableSkeleton rows={4} />,
});
const SharedProposalTable = dynamic(
	() => import("@/components/shared/SharedProposalTable"),
	{
		loading: () => <TableSkeleton rows={5} />,
	},
);

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
		isSaved: Boolean(row.is_saved ?? false),
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
	const { theme, toggleTheme } = useTheme();

	const [monthFilter, setMonthFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState<"All" | Proposal["status"]>(
		"All",
	);
	const [viewMode, setViewMode] = useState<"dashboard" | "analytics">(
		"dashboard",
	);
	const [access, setAccess] = useState<ShareAccessInfo | null>(null);
	const [proposals, setProposals] = useState<Proposal[]>([]);
	const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
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

			const mapped = ((rows as Record<string, unknown>[] | null) ?? []).map(
				mapSharedRow,
			);
			setProposals(mapped);
			setOwnerUserId(mapped[0]?.userId ?? null);
			setLoading(false);
		};

		void load();
	}, [token, session?.user?.id]);

	useEffect(() => {
		if (!access?.canAccess) return;
		const channel = supabase
			.channel(`shared-proposals-live-${token}`)
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "proposals" },
				(payload) => {
					const raw = (payload.new || payload.old) as Record<
						string,
						unknown
					> | null;
					if (!raw) return;
					const rowUserId = (raw.user_id as string | undefined) ?? null;
					if (ownerUserId && rowUserId && rowUserId !== ownerUserId) return;
					const next = mapSharedRow(raw);

					setProposals((curr) => {
						if (payload.eventType === "DELETE") {
							return curr.filter((item) => item.id !== next.id);
						}
						if (payload.eventType === "INSERT") {
							return curr.some((item) => item.id === next.id)
								? curr
								: [next, ...curr];
						}
						if (curr.some((item) => item.id === next.id)) {
							return curr.map((item) =>
								item.id === next.id ? { ...item, ...next } : item,
							);
						}
						return curr;
					});
				},
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [token, access?.canAccess, ownerUserId]);

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

	const monthFiltered = useMemo(
		() =>
			proposals.filter(
				(p) => monthFilter === "all" || p.dateSent.startsWith(monthFilter),
			),
		[proposals, monthFilter],
	);

	const filtered = useMemo(
		() =>
			monthFiltered.filter(
				(p) => statusFilter === "All" || p.status === statusFilter,
			),
		[monthFiltered, statusFilter],
	);

	const logoutShared = async () => {
		await supabase.auth.signOut();
	};

	if (loading) {
		return (
			<div style={fullPage}>
				<div style={{ width: "100%", maxWidth: 920 }}>
					<TableSkeleton rows={4} />
				</div>
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
						<Link
							href={`/shared-signin?next=${encodeURIComponent(`/shared/${token}`)}`}
							style={linkBtn}
						>
							Open Shared Login
						</Link>
				</div>
			</div>
		);
	}

	return (
		<div
			className="fade-in-up"
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
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
						flexWrap: "wrap",
					}}
				>
					<button onClick={toggleTheme} style={linkBtn}>
						{theme === "dark" ? <FaSun /> : <FaMoon />}{" "}
						{theme === "dark" ? "Light" : "Dark"}
					</button>
					{session ? (
						<>
							<button onClick={() => void logoutShared()} style={linkBtn}>
								<FaSignOutAlt /> Logout
							</button>
						</>
						) : (
							<Link
								href={`/shared-signin?next=${encodeURIComponent(`/shared/${token}`)}`}
								style={linkBtn}
							>
								Login
							</Link>
						)}
					<Link href="/" style={linkBtn}>
						Open App
					</Link>
				</div>
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
					<div className="shared-month-switcher" style={{ marginTop: 8 }}>
						<MonthDropdown
							value={monthFilter}
							onChange={setMonthFilter}
							options={monthSelectOptions}
							width={260}
						/>
					</div>
				</div>

				{viewMode === "dashboard" ? (
					<div className="shared-view-stack">
						<div className="shared-mobile-hide-stats">
							<DashboardStats proposals={filtered} />
						</div>
						<div className="shared-status-filters">
							<Filters
								currentFilter={statusFilter}
								setFilter={setStatusFilter}
								proposals={monthFiltered}
							/>
						</div>
						<SharedProposalTable proposals={filtered} token={token} />
					</div>
				) : (
					<div className="shared-view-stack">
						<div className="shared-mobile-hide-stats">
							<DashboardStats proposals={filtered} />
						</div>
						<Insights proposals={filtered} />
						<Charts proposals={filtered} />
					</div>
				)}
			</div>
			<style>{`
        .shared-view-stack {
          display: grid;
          gap: 12px;
          min-width: 0;
        }
        .shared-view-stack > * {
          margin: 0 !important;
          min-width: 0;
        }
        .shared-month-switcher {
          width: 260px;
          max-width: 100%;
        }
        @media (max-width: 700px) {
          .shared-status-filters {
            display: none;
          }
          .shared-view-stack {
            gap: 10px;
          }
        }
        @media (max-width: 768px) {
          .shared-month-switcher {
            width: auto !important;
            max-width: 180px !important;
            margin-left: 0 !important;
            margin-right: auto !important;
          }
          .shared-month-switcher > div {
            width: 180px !important;
            max-width: 100% !important;
          }
          .shared-mobile-hide-stats {
            display: none !important;
          }
        }
      `}</style>
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
