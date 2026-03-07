"use client";
import React, { useMemo } from "react";
import {
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	LineChart,
	Line,
	AreaChart,
	Area,
} from "recharts";
import { Proposal } from "@/lib/types/proposal";

function ChartTooltip({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: Array<{ color?: string; name?: string; value?: number | string }>;
	label?: string;
}) {
	if (!active || !payload?.length) return null;
	return (
		<div
			style={{
				background: "var(--bg-soft)",
				border: "1px solid var(--border)",
				borderRadius: 8,
				padding: "10px 14px",
			}}
		>
			{label && (
				<div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>
					{label}
				</div>
			)}
			{payload.map((p, i) => (
				<div
					key={i}
					style={{
						fontSize: 13,
						color: p.color || "var(--text)",
						fontFamily: "monospace",
						fontWeight: 600,
					}}
				>
					{p.name}: {p.value}
				</div>
			))}
		</div>
	);
}

const Section = ({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) => (
	<div style={{ marginBottom: 28 }}>
		<div
			style={{
				fontSize: 11,
				color: "var(--muted)",
				letterSpacing: "0.12em",
				textTransform: "uppercase",
				fontWeight: 700,
				marginBottom: 12,
			}}
		>
			{title}
		</div>
		{children}
	</div>
);

export default function Charts({
	proposals,
}: {
	proposals: Proposal[];
	monthOrder?: "asc" | "desc";
}) {
	const stats = useMemo(() => {
		const total = proposals.length;
		const hired = proposals.filter((p) => p.status === "Hired").length;
		const viewed = proposals.filter((p) => p.viewed).length;
		const replied = proposals.filter((p) =>
			["Replied", "Interview", "Hired"].includes(p.status),
		).length;
		const interviews = proposals.filter((p) => p.status === "Interview").length;

		const monthMap: Record<
			string,
			{
				month: string;
				total: number;
				hired: number;
				replied: number;
				connects: number;
			}
		> = {};
		proposals.forEach((p) => {
			const month = p.dateSent.slice(0, 7);
			if (!monthMap[month])
				monthMap[month] = {
					month,
					total: 0,
					hired: 0,
					replied: 0,
					connects: 0,
				};
			monthMap[month].total += 1;
			monthMap[month].connects += p.connects || 0;
			if (["Replied", "Interview", "Hired"].includes(p.status))
				monthMap[month].replied += 1;
			if (p.status === "Hired") monthMap[month].hired += 1;
		});

		const monthly = Object.values(monthMap)
			.sort((a, b) => a.month.localeCompare(b.month))
			.map((m) => ({
				...m,
				monthLabel: new Date(`${m.month}-01`).toLocaleString("en-US", {
					month: "short",
					year: "2-digit",
				}),
				winRate: m.total ? Math.round((m.hired / m.total) * 100) : 0,
			}));

		const funnel = [
			{ name: "Sent", value: total, fill: "#94A3B8" },
			{ name: "Viewed", value: viewed, fill: "#FFD060" },
			{ name: "Replied", value: replied, fill: "#B06EFF" },
			{ name: "Interview", value: interviews, fill: "#00D4FF" },
			{ name: "Hired", value: hired, fill: "#00E599" },
		];

		return { monthly, funnel };
	}, [proposals]);

	if (!proposals.length) return null;

	return (
		<>
			<Section title="Monthly Trend and Funnel">
				<div
					style={{ display: "grid", gridTemplateColumns: "1fr 1.7fr", gap: 14 }}
					className="charts-grid"
				>
					<div
						style={{
							background: "var(--bg-soft)",
							border: "1px solid var(--border)",
							borderRadius: 10,
							padding: 16,
						}}
					>
						{stats.funnel.map((f, i) => {
							const pct = stats.funnel[0].value
								? Math.round((f.value / stats.funnel[0].value) * 100)
								: 0;
							return (
								<div
									key={f.name}
									style={{ marginBottom: i < stats.funnel.length - 1 ? 8 : 0 }}
								>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											marginBottom: 4,
										}}
									>
										<span
											style={{ fontSize: 12, color: f.fill, fontWeight: 600 }}
										>
											{f.name}
										</span>
										<span
											style={{
												fontSize: 12,
												color: "var(--text)",
												fontFamily: "monospace",
											}}
										>
											{f.value}{" "}
											<span style={{ color: "var(--muted)" }}>({pct}%)</span>
										</span>
									</div>
									<div
										style={{
											background: "var(--border)",
											borderRadius: 3,
											height: 6,
											overflow: "hidden",
										}}
									>
										<div
											style={{
												width: `${pct}%`,
												height: "100%",
												background: f.fill,
												borderRadius: 3,
											}}
										/>
									</div>
								</div>
							);
						})}
					</div>

					<div
						style={{
							background: "var(--bg-soft)",
							border: "1px solid var(--border)",
							borderRadius: 10,
							padding: 16,
						}}
						className="chart-panel"
					>
						<ResponsiveContainer width="100%" height={220}>
							<AreaChart data={stats.monthly}>
								<XAxis
									dataKey="monthLabel"
									tick={{ fill: "var(--muted)", fontSize: 11 }}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									tick={{ fill: "var(--muted)", fontSize: 11 }}
									axisLine={false}
									tickLine={false}
								/>
								<Tooltip content={<ChartTooltip />} />
								<Area
									type="monotone"
									dataKey="total"
									stroke="#00D4FF"
									fill="#00D4FF22"
									strokeWidth={2}
									name="Sent"
								/>
								<Area
									type="monotone"
									dataKey="hired"
									stroke="#00E599"
									fill="#00E5991a"
									strokeWidth={2}
									name="Hired"
								/>
							</AreaChart>
						</ResponsiveContainer>
						<ResponsiveContainer width="100%" height={80}>
							<LineChart data={stats.monthly}>
								<XAxis dataKey="monthLabel" hide />
								<YAxis hide domain={[0, 100]} />
								<Tooltip content={<ChartTooltip />} />
								<Line
									type="monotone"
									dataKey="winRate"
									stroke="#B06EFF"
									strokeWidth={2}
									dot={{ r: 2, fill: "#B06EFF" }}
									name="Win Rate %"
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>
				<style>{`
          @media (max-width: 900px) {
            .charts-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
            .chart-panel { padding: 12px !important; }
          }
        `}</style>
			</Section>
		</>
	);
}
