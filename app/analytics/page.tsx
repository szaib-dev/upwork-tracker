"use client";
import { useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { useProposals } from "@/hooks/proposal";
import DashboardStats from "@/components/analytics/DashboardStats";
import Insights from "@/components/analytics/Insights";
import Charts from "@/components/analytics/Charts";
import MonthDropdown from "@/components/MonthDropdown";

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
	const { proposals, loading } = useProposals(session?.user?.id);
	const [monthFilter, setMonthFilter] = useState("all");

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

	if (!session) {
		return (
			<div
				style={{
					minHeight: "100vh",
					background: "var(--bg)",
					color: "var(--text)",
					display: "grid",
					placeItems: "center",
				}}
			>
				<div>Please sign in to view analytics.</div>
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
			<AppHeader />
			<main
				style={{
					width: "100%",
					padding: "10px 10px 20px",
					display: "grid",
					gap: 10,
					maxWidth: 1320,
					margin: "0 auto",
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
							minWidth: 230,
							display: "grid",
							gap: 8,
							justifyItems: "end",
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
							width={240}
						/>
					</div>
				</section>

				{loading ? (
					<div style={{ color: "var(--muted)" }}>Loading analytics...</div>
				) : (
					<>
						<section
							style={{
								...card,
								display: "grid",
								gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
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
          }
          .analytics-title { font-size: 21px !important; }
          .analytics-subtitle { font-size: 12px !important; }
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
