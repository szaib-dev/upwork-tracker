import React, { useMemo } from "react";
import { Proposal } from "@/lib/types/proposal";

function InsightCard({
	title,
	value,
	note,
	color,
}: {
	title: string;
	value: string;
	note: string;
	color: string;
}) {
	return (
		<div
			style={{
				background: "var(--bg-soft)",
				border: "1px solid var(--border)",
				borderRadius: 10,
				padding: 16,
			}}
		>
			<div
				style={{
					fontSize: 10,
					color: "var(--muted)",
					letterSpacing: "0.08em",
					textTransform: "uppercase",
					marginBottom: 8,
				}}
			>
				{title}
			</div>
			<div
				style={{
					fontFamily: "monospace",
					fontSize: 24,
					color,
					fontWeight: 700,
				}}
			>
				{value}
			</div>
			<div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
				{note}
			</div>
		</div>
	);
}

export default function Insights({
	proposals,
	monthOrder = "desc",
}: {
	proposals: Proposal[];
	monthOrder?: "asc" | "desc";
}) {
	const data = useMemo(() => {
		const monthMap: Record<
			string,
			{ sent: number; hired: number; connects: number; revenue: number }
		> = {};
		const countryMap: Record<string, { total: number; hired: number }> = {};

		proposals.forEach((p) => {
			const monthKey = (p.dateSent || "").slice(0, 7);
			if (monthKey) {
				if (!monthMap[monthKey])
					monthMap[monthKey] = { sent: 0, hired: 0, connects: 0, revenue: 0 };
				monthMap[monthKey].sent += 1;
				monthMap[monthKey].connects += p.connects || 0;
				if (p.status === "Hired") {
					monthMap[monthKey].hired += 1;
					monthMap[monthKey].revenue += p.budget || 0;
				}
			}

			if (p.clientCountry) {
				if (!countryMap[p.clientCountry])
					countryMap[p.clientCountry] = { total: 0, hired: 0 };
				countryMap[p.clientCountry].total += 1;
				if (p.status === "Hired") countryMap[p.clientCountry].hired += 1;
			}
		});

		const monthsAsc = Object.entries(monthMap)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([month, value]) => ({
				month,
				label: new Date(`${month}-01`).toLocaleString("en-US", {
					month: "short",
					year: "numeric",
				}),
				...value,
				winRate: value.sent ? Math.round((value.hired / value.sent) * 100) : 0,
			}));

		const months = monthOrder === "asc" ? monthsAsc : [...monthsAsc].reverse();

		const bestMonth = monthsAsc.reduce<(typeof monthsAsc)[number] | null>(
			(best, month) => {
				if (!best) return month;
				if (month.hired > best.hired) return month;
				if (month.hired === best.hired && month.winRate > best.winRate)
					return month;
				return best;
			},
			null,
		);

		const thisMonth = monthsAsc.at(-1);
		const prevMonth = monthsAsc.at(-2);

		const topCountry = Object.entries(countryMap)
			.sort(([, a], [, b]) => b.total - a.total)
			.map(([country, value]) => ({
				country,
				...value,
				winRate: value.total
					? Math.round((value.hired / value.total) * 100)
					: 0,
			}))
			.at(0);

		const connectEfficiency = [
			{ label: "Low (<=4)", min: 0, max: 4 },
			{ label: "Mid (5-8)", min: 5, max: 8 },
			{ label: "High (9+)", min: 9, max: 100 },
		]
			.map((bucket) => {
				const set = proposals.filter(
					(p) => p.connects >= bucket.min && p.connects <= bucket.max,
				);
				const hired = set.filter((p) => p.status === "Hired").length;
				return {
					label: bucket.label,
					total: set.length,
					winRate: set.length ? Math.round((hired / set.length) * 100) : 0,
				};
			})
			.sort((a, b) => b.winRate - a.winRate);

		return {
			months,
			bestMonth,
			thisMonth,
			prevMonth,
			topCountry,
			bestConnectBand: connectEfficiency[0],
		};
	}, [proposals, monthOrder]);

	if (!proposals.length) return null;

	const monthDelta =
		data.thisMonth && data.prevMonth
			? data.thisMonth.sent - data.prevMonth.sent
			: 0;

	return (
		<div style={{ marginBottom: 28 }}>
			<div
				style={{
					fontSize: 11,
					color: "var(--muted)",
					letterSpacing: "0.12em",
					textTransform: "uppercase",
					fontWeight: 700,
					marginBottom: 16,
				}}
			>
				Analytics Highlights
			</div>

			<div
				style={{
					display: "grid",
					gap: 12,
					gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
					marginBottom: 14,
				}}
				className="insights-grid"
			>
				<InsightCard
					title="Best Month"
					value={data.bestMonth?.label ?? "-"}
					note={
						data.bestMonth
							? `${data.bestMonth.hired} hires, ${data.bestMonth.winRate}% win rate`
							: "No monthly data yet"
					}
					color="var(--success)"
				/>
				<InsightCard
					title="Monthly Momentum"
					value={`${monthDelta >= 0 ? "+" : ""}${monthDelta}`}
					note={
						data.thisMonth
							? `${data.thisMonth.label} vs previous month`
							: "Need at least 2 months"
					}
					color={monthDelta >= 0 ? "var(--primary)" : "var(--danger)"}
				/>
				<InsightCard
					title="Top Country"
					value={data.topCountry?.country ?? "-"}
					note={
						data.topCountry
							? `${data.topCountry.total} proposals, ${data.topCountry.winRate}% win rate`
							: "No country data yet"
					}
					color="#ffd060"
				/>
				<InsightCard
					title="Best Connect Band"
					value={data.bestConnectBand?.label ?? "-"}
					note={
						data.bestConnectBand
							? `${data.bestConnectBand.winRate}% win rate`
							: "Not enough data"
					}
					color="#b06eff"
				/>
			</div>

			<div
				style={{
					background: "var(--bg-soft)",
					border: "1px solid var(--border)",
					borderRadius: 12,
					padding: 16,
				}}
			>
				<div
					style={{
						fontSize: 11,
						color: "var(--muted)",
						textTransform: "uppercase",
						letterSpacing: "0.08em",
						marginBottom: 10,
					}}
				>
					Monthly Breakdown
				</div>
				<div style={{ overflowX: "auto" }}>
					<table
						style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}
					>
						<thead>
							<tr>
								{[
									"Month",
									"Sent",
									"Hired",
									"Win Rate",
									"Connects",
									"Revenue",
								].map((head) => (
									<th
										key={head}
										style={{
											textAlign: "left",
											padding: "8px 10px",
											color: "var(--muted)",
											fontSize: 10,
											textTransform: "uppercase",
											letterSpacing: "0.08em",
											borderBottom: "1px solid var(--border)",
										}}
									>
										{head}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{data.months.map((month) => (
								<tr key={month.month}>
									<td
										style={{
											padding: "8px 10px",
											color: "var(--text)",
											fontFamily: "monospace",
										}}
									>
										{month.label}
									</td>
									<td style={{ padding: "8px 10px", color: "var(--muted)" }}>
										{month.sent}
									</td>
									<td style={{ padding: "8px 10px", color: "var(--success)" }}>
										{month.hired}
									</td>
									<td style={{ padding: "8px 10px", color: "var(--primary)" }}>
										{month.winRate}%
									</td>
									<td style={{ padding: "8px 10px", color: "#ffd060" }}>
										{month.connects}
									</td>
									<td style={{ padding: "8px 10px", color: "#b06eff" }}>
										${month.revenue.toLocaleString()}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
			<style>{`
        @media (max-width: 1100px) {
          .insights-grid { grid-template-columns: repeat(2, minmax(150px, 1fr)) !important; }
        }
        @media (max-width: 700px) {
          .insights-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
        }
      `}</style>
		</div>
	);
}
