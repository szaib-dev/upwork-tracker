import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function GlobalLoading() {
	return (
		<div
			style={{
				minHeight: "100vh",
				background: "var(--bg)",
				color: "var(--text)",
				padding: 12,
				maxWidth: 1320,
				margin: "0 auto",
				display: "grid",
				gap: 10,
			}}
		>
			<CardSkeleton />
			<TableSkeleton rows={6} />
		</div>
	);
}
