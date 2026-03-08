"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { useProposals } from "@/hooks/proposal";
import MonthDropdown from "@/components/MonthDropdown";
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

function formatMonthLabel(month: string) {
	return new Date(`${month}-01`).toLocaleString("en-US", {
		month: "short",
		year: "numeric",
	});
}

function weekdayName(dateStr: string) {
	const d = new Date(dateStr);
	return d.toLocaleString("en-US", { weekday: "short" });
}

export default function AnalyticsDashboard() {
	const { session } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const { proposals, loading } = useProposals(session?.user?.id);
	const [monthFilter, setMonthFilter] = useState("all");

	useEffect(() => {
		if (session) return;
		router.replace(`/?next=${encodeURIComponent(pathname || "/analytics")}`);
	}, [session, router, pathname]);

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

	const filtered = useMemo(() => {
		if (monthFilter === "all") return proposals;
		return proposals.filter((p) => p.dateSent.startsWith(monthFilter));
	}, [proposals, monthFilter]);

	const advanced = useMemo(() => {
		const statusCounts: Record<string, number> = {};
		const weekdayCounts: Record<string, number> = {
			Mon: 0,
			Tue: 0,
			Wed: 0,
			Thu: 0,
			Fri: 0,
			Sat: 0,
			Sun: 0,
		};
		let totalBudget = 0;
		let withBudget = 0;
		let leads = 0;
		let boosted = 0;
		for (const p of filtered) {
			statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
			totalBudget += p.budget || 0;
			if ((p.budget || 0) > 0) withBudget += 1;
			if (p.lead) leads += 1;
			if (p.boosted) boosted += 1;
			const day = weekdayName(p.dateSent);
			if (weekdayCounts[day] !== undefined) weekdayCounts[day] += 1;
		}

		const topStatus = Object.entries(statusCounts).sort(
			(a, b) => b[1] - a[1],
		)[0];
		const bestDay = Object.entries(weekdayCounts).sort(
			(a, b) => b[1] - a[1],
		)[0];
		const avgBudget = withBudget ? Math.round(totalBudget / withBudget) : 0;
		const leadRate = filtered.length
			? Math.round((leads / filtered.length) * 100)
			: 0;
		const boostedRate = filtered.length
			? Math.round((boosted / filtered.length) * 100)
			: 0;

		return { topStatus, bestDay, avgBudget, leadRate, boostedRate };
	}, [filtered]);

	if (!session) return null;

	return (
		<div
			className="fade-in-up"
			style={{
				background: "var(--bg)",
				minHeight: "100vh",
				color: "var(--text)",
			}}
		>
			<AppHeader />
			<main
				style={{
					width: "100%",
					padding: "10px 10px 20px",
					display: "grid",
					gap: 10,
					maxWidth: 1320,
					margin: "0 auto",
					minWidth: 0,
					overflowX: "clip",
				}}
				className="analytics-main"
			>
				<section style={heroCard} className="analytics-hero">
					<div style={{ minWidth: 0 }}>
						<div
							style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}
							className="analytics-title"
						>
							Analytics Command Center
						</div>
						<div
							style={{ color: "var(--muted)", fontSize: 13, marginTop: 5 }}
							className="analytics-subtitle"
						>
							Advanced metrics, sharing controls, and monthly performance
							intelligence.
						</div>
					</div>
					<div
						style={{
							minWidth: 0,
							display: "grid",
							gap: 8,
							justifyItems: "end",
							width: "100%",
							maxWidth: 260,
						}}
						className="analytics-filter"
					>
						<div
							style={{
								fontSize: 11,
								color: "var(--muted)",
								textTransform: "uppercase",
								letterSpacing: "0.08em",
								marginBottom: 2,
							}}
						>
							Filter Month
						</div>
						<MonthDropdown
							value={monthFilter}
							onChange={setMonthFilter}
							options={monthSelectOptions}
							width={260}
						/>
					</div>
				</section>

				{loading ? (
					<div style={{ display: "grid", gap: 10 }}>
						<CardSkeleton />
						<TableSkeleton rows={4} />
					</div>
				) : (
					<>
						<section
							style={{
								...card,
								display: "grid",
								gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
								gap: 8,
							}}
						>
							<MiniMetric
								label="Top Status"
								value={
									advanced.topStatus
										? `${advanced.topStatus[0]} (${advanced.topStatus[1]})`
										: "-"
								}
							/>
							<MiniMetric
								label="Best Apply Day"
								value={
									advanced.bestDay
										? `${advanced.bestDay[0]} (${advanced.bestDay[1]})`
										: "-"
								}
							/>
							<MiniMetric label="Avg Budget" value={`$${advanced.avgBudget}`} />
							<MiniMetric label="Lead Rate" value={`${advanced.leadRate}%`} />
							<MiniMetric
								label="Boosted Rate"
								value={`${advanced.boostedRate}%`}
							/>
						</section>

						<DashboardStats proposals={filtered} />
						<Insights proposals={filtered} />
						<Charts proposals={filtered} />
					</>
				)}
			</main>
			<style>{`
        .analytics-main,
        .analytics-main * {
          min-width: 0;
          box-sizing: border-box;
        }
        @media (max-width: 900px) {
          .analytics-main {
            padding-left: 8px !important;
            padding-right: 8px !important;
            gap: 8px !important;
          }
          .analytics-hero {
            align-items: flex-start !important;
            gap: 10px !important;
          }
          .analytics-filter {
            min-width: 100% !important;
            justify-items: stretch !important;
            max-width: 100% !important;
          }
          .analytics-title { font-size: 21px !important; }
          .analytics-subtitle { font-size: 12px !important; }
        }
        @media (max-width: 520px) {
          .analytics-main {
            padding-left: 6px !important;
            padding-right: 6px !important;
          }
          .analytics-hero {
            padding: 10px !important;
          }
          .analytics-title {
            font-size: 18px !important;
          }
        }
      `}</style>
		</div>
	);
}

function MiniMetric({ label, value }: { label: string; value: string }) {
	return (
		<div
			style={{
				background:
					"linear-gradient(180deg, color-mix(in srgb, var(--bg-elev) 92%, #fff 8%), var(--bg-elev))",
				border: "1px solid var(--border)",
				borderRadius: 12,
				padding: "11px",
			}}
		>
			<div
				style={{
					fontSize: 11,
					color: "var(--muted)",
					textTransform: "uppercase",
					letterSpacing: "0.08em",
				}}
			>
				{label}
			</div>
			<div
				style={{
					marginTop: 8,
					fontSize: 20,
					fontWeight: 700,
					color: "var(--text)",
					textRendering: "geometricPrecision",
				}}
			>
				{value}
			</div>
		</div>
	);
}

const heroCard: React.CSSProperties = {
	background: "var(--bg-soft)",
	border: "1px solid var(--border)",
	borderRadius: 14,
	padding: 12,
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	gap: 10,
	flexWrap: "wrap",
};
const card: React.CSSProperties = {
	background: "var(--bg-soft)",
	border: "1px solid var(--border)",
	borderRadius: 14,
	padding: 10,
};
