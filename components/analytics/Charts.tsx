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
	CartesianGrid,
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
				background: "var(--bg-elev)",
				border: "1px solid var(--border)",
				borderRadius: 12,
				padding: "12px 16px",
				boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
				backdropFilter: "blur(4px)",
			}}
		>
			{label && (
				<div
					style={{
						fontSize: 10,
						color: "var(--muted)",
						textTransform: "uppercase",
						letterSpacing: "0.05em",
						marginBottom: 8,
					}}
				>
					{label}
				</div>
			)}
			{payload.map((p, i) => (
				<div
					key={i}
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
						fontSize: 13,
						color: "var(--text)",
						fontFamily: "monospace",
						fontWeight: 600,
						marginTop: i > 0 ? 4 : 0,
					}}
				>
					<span
						style={{
							width: 8,
							height: 8,
							borderRadius: "50%",
							background: p.color,
						}}
					/>
					{p.name}: {p.value}
					{p.name?.includes("%") || p.name === "Win Rate" ? "%" : ""}
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
	<div style={{ marginBottom: 32 }}>
		<div
			style={{
				fontSize: 10,
				color: "var(--muted)",
				letterSpacing: "0.15em",
				textTransform: "uppercase",
				fontWeight: 800,
				marginBottom: 16,
				display: "flex",
				alignItems: "center",
				gap: 12,
			}}
		>
			{title}
			<div
				style={{
					flex: 1,
					height: 1,
					background: "var(--border)",
					opacity: 0.5,
				}}
			/>
		</div>
		{children}
	</div>
);

export default function Charts({ proposals }: { proposals: Proposal[] }) {
	const stats = useMemo(() => {
		type MonthlyPoint = {
			month: string;
			total: number;
			hired: number;
			replied: number;
			connects: number;
		};
		const total = proposals.length;
		const hired = proposals.filter((p) => p.status === "Hired").length;
		const viewed = proposals.filter((p) => p.viewed).length;
		const replied = proposals.filter((p) =>
			["Replied", "Interview", "Hired"].includes(p.status),
		).length;
		const interviews = proposals.filter((p) => p.status === "Interview").length;

		const monthMap: Record<string, MonthlyPoint> = {};
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
				}),
				winRate: m.total ? Math.round((m.hired / m.total) * 100) : 0,
			}));

		const funnel = [
			{ name: "Sent", value: total, fill: "var(--muted)" },
			{ name: "Viewed", value: viewed, fill: "#FFD060" },
			{ name: "Replied", value: replied, fill: "#B06EFF" },
			{ name: "Interview", value: interviews, fill: "#00D4FF" },
			{ name: "Hired", value: hired, fill: "var(--primary)" },
		];

		return { monthly, funnel };
	}, [proposals]);

	if (!proposals.length) return null;

	return (
		<Section title="Performance Analytics">
			<div className="charts-container">
				{/* Funnel Widget */}
				<div className="funnel-card">
					<div style={{ marginBottom: 20 }}>
						<h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
							Conversion Funnel
						</h4>
						<p
							style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}
						>
							Sent to Hired ratio
						</p>
					</div>
					{stats.funnel.map((f, i) => {
						const pct = stats.funnel[0].value
							? Math.round((f.value / stats.funnel[0].value) * 100)
							: 0;
						return (
							<div
								key={f.name}
								style={{ marginBottom: i < stats.funnel.length - 1 ? 14 : 0 }}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										marginBottom: 6,
										alignItems: "flex-end",
									}}
								>
									<span
										style={{
											fontSize: 11,
											color: f.fill,
											fontWeight: 700,
											textTransform: "uppercase",
											letterSpacing: "0.05em",
										}}
									>
										{f.name}
									</span>
									<span
										style={{
											fontSize: 12,
											color: "var(--text)",
											fontFamily: "monospace",
											fontWeight: 700,
										}}
									>
										{f.value}{" "}
										<span
											style={{
												color: "var(--muted)",
												fontWeight: 400,
												fontSize: 10,
											}}
										>
											({pct}%)
										</span>
									</span>
								</div>
								<div
									style={{
										background: "rgba(255,255,255,0.05)",
										borderRadius: 10,
										height: 6,
										overflow: "hidden",
									}}
								>
									<div
										style={{
											width: `${pct}%`,
											height: "100%",
											background: f.fill,
											borderRadius: 10,
											transition: "width 1s ease-in-out",
										}}
									/>
								</div>
							</div>
						);
					})}
				</div>

				{/* Monthly Trend Area Chart */}
				<div className="trend-card">
					<div
						style={{
							marginBottom: 20,
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<div>
							<h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
								Monthly Trends
							</h4>
							<p
								style={{
									margin: "4px 0 0",
									fontSize: 12,
									color: "var(--muted)",
								}}
							>
								Volume vs. Hires
							</p>
						</div>
						<div
							style={{
								display: "flex",
								gap: 12,
								flexWrap: "wrap",
								justifyContent: "flex-end",
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 4,
									fontSize: 10,
									color: "var(--muted)",
								}}
							>
								<span
									style={{
										width: 8,
										height: 8,
										borderRadius: "50%",
										background: "#00D4FF",
									}}
								/>{" "}
								Sent
							</div>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 4,
									fontSize: 10,
									color: "var(--muted)",
								}}
							>
								<span
									style={{
										width: 8,
										height: 8,
										borderRadius: "50%",
										background: "var(--primary)",
									}}
								/>{" "}
								Hired
							</div>
						</div>
					</div>

					<ResponsiveContainer width="100%" height={240}>
						<AreaChart
							data={stats.monthly}
							margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
						>
							<defs>
								<linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
									<stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
								</linearGradient>
								<linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="var(--primary)"
										stopOpacity={0.3}
									/>
									<stop
										offset="95%"
										stopColor="var(--primary)"
										stopOpacity={0}
									/>
								</linearGradient>
							</defs>
							<CartesianGrid
								strokeDasharray="3 3"
								vertical={false}
								stroke="var(--border)"
								opacity={0.5}
							/>
							<XAxis
								dataKey="monthLabel"
								tick={{ fill: "var(--muted)", fontSize: 10 }}
								axisLine={false}
								tickLine={false}
								dy={10}
							/>
							<YAxis
								tick={{ fill: "var(--muted)", fontSize: 10 }}
								axisLine={false}
								tickLine={false}
							/>
							<Tooltip
								content={<ChartTooltip />}
								cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
							/>
							<Area
								type="monotone"
								dataKey="total"
								stroke="#00D4FF"
								fillOpacity={1}
								fill="url(#colorTotal)"
								strokeWidth={2}
								name="Total Sent"
							/>
							<Area
								type="monotone"
								dataKey="hired"
								stroke="var(--primary)"
								fillOpacity={1}
								fill="url(#colorHired)"
								strokeWidth={2}
								name="Total Hired"
							/>
						</AreaChart>
					</ResponsiveContainer>

					{/* Win Rate Sparkline */}
					<div
						style={{
							marginTop: 20,
							borderTop: "1px solid var(--border)",
							paddingTop: 20,
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: 10,
							}}
						>
							<span style={{ fontSize: 12, fontWeight: 600 }}>
								Win Rate Trend
							</span>
							<span
								style={{
									fontSize: 11,
									color: "#B06EFF",
									fontFamily: "monospace",
								}}
							>
								Avg.{" "}
								{Math.round(
									stats.monthly.reduce((acc, curr) => acc + curr.winRate, 0) /
										stats.monthly.length || 0,
								)}
								%
							</span>
						</div>
						<ResponsiveContainer width="100%" height={60}>
							<LineChart data={stats.monthly}>
								<Tooltip content={<ChartTooltip />} />
								<Line
									type="monotone"
									dataKey="winRate"
									stroke="#B06EFF"
									strokeWidth={3}
									dot={{ r: 3, fill: "#B06EFF", strokeWidth: 0 }}
									activeDot={{ r: 5, strokeWidth: 0 }}
									name="Win Rate"
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>

			<style>{`
                .charts-container {
                    display: grid;
                    grid-template-columns: 350px 1fr;
                    gap: 20px;
                    align-items: start;
                }
                .funnel-card, .trend-card {
                    background: var(--bg-soft);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 24px;
                }
                @media (max-width: 1024px) {
                    .charts-container {
                        grid-template-columns: 1fr;
                    }
                }
                @media (max-width: 640px) {
                    .funnel-card, .trend-card {
                        padding: 16px;
                        border-radius: 12px;
                    }
                    .charts-container {
                        gap: 12px;
                    }
                }
            `}</style>
		</Section>
	);
}
