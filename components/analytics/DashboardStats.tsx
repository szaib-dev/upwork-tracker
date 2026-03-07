import React, { useMemo } from "react";
import { Proposal } from "@/lib/types/proposal";

function StatCard({
	label,
	value,
	color,
	sub,
}: {
	label: string;
	value: React.ReactNode;
	color: string;
	sub?: string;
}) {
	return (
		<div
			style={{
				background: "var(--bg-elev)",
				border: "1px solid var(--border)",
				borderRadius: 12,
				padding: "14px 16px",
				minWidth: 120,
			}}
		>
			<div
				style={{
					fontSize: 22,
					fontWeight: 800,
					color,
					fontFamily: "monospace",
					lineHeight: 1,
				}}
			>
				{value}
			</div>
			{sub && (
				<div
					style={{
						fontSize: 11,
						color: "var(--muted)",
						fontFamily: "monospace",
						marginTop: 2,
					}}
				>
					{sub}
				</div>
			)}
			<div
				style={{
					fontSize: 11,
					color: "var(--muted)",
					marginTop: 4,
					letterSpacing: "0.06em",
					textTransform: "uppercase",
				}}
			>
				{label}
			</div>
		</div>
	);
}

export default function DashboardStats({
	proposals,
}: {
	proposals: Proposal[];
}) {
	const stats = useMemo(() => {
		const total = proposals.length;
		const hired = proposals.filter((p) => p.status === "Hired").length;
		const viewed = proposals.filter((p) => p.viewed).length;
		const replied = proposals.filter((p) =>
			["Replied", "Interview", "Hired"].includes(p.status),
		).length;
		const connects = proposals.reduce((a, p) => a + (p.connects || 0), 0);
		const totalBudget = proposals
			.filter((p) => p.status === "Hired")
			.reduce((a, p) => a + (p.budget || 0), 0);

		return {
			total,
			hired,
			connects,
			totalBudget,
			winRate: total ? Math.round((hired / total) * 100) : 0,
			viewRate: total ? Math.round((viewed / total) * 100) : 0,
			replyRate: total ? Math.round((replied / total) * 100) : 0,
			costPerHire: hired ? Math.round(connects / hired) : 0,
			avgBudget: hired ? Math.round(totalBudget / hired) : 0,
		};
	}, [proposals]);

	return (
		<div
			style={{
				border: "1px solid var(--border)",
				background: "var(--bg-soft)",
				borderRadius: 14,
				padding: 12,
			}}
		>
			<div
				style={{
					display: "grid",
					gap: 10,
					gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
				}}
			>
				<StatCard label="Total" value={stats.total} color="var(--text)" />
				<StatCard
					label="Hired"
					value={stats.hired}
					color="var(--success)"
					sub={`$${stats.totalBudget.toLocaleString()} earned`}
				/>
				<StatCard
					label="Win Rate"
					value={`${stats.winRate}%`}
					color="var(--success)"
				/>
				<StatCard
					label="View Rate"
					value={`${stats.viewRate}%`}
					color="#ffd060"
				/>
				<StatCard
					label="Reply Rate"
					value={`${stats.replyRate}%`}
					color="#b06eff"
				/>
				<StatCard
					label="Connects Used"
					value={stats.connects}
					color="var(--primary)"
					sub={`${stats.costPerHire} per hire`}
				/>
				<StatCard
					label="Avg Job Budget"
					value={`$${stats.avgBudget}`}
					color="#ff9d5c"
				/>
			</div>
		</div>
	);
}
