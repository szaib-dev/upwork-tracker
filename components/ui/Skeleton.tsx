"use client";

import type React from "react";

type SkeletonProps = {
	width?: number | string;
	height?: number | string;
	radius?: number;
	style?: React.CSSProperties;
};

export function Skeleton({
	width = "100%",
	height = 14,
	radius = 8,
	style,
}: SkeletonProps) {
	return (
		<div
			style={{
				width,
				height,
				borderRadius: radius,
				background:
					"linear-gradient(90deg, color-mix(in srgb, var(--bg-elev) 88%, white 12%), color-mix(in srgb, var(--bg-elev) 78%, white 22%), color-mix(in srgb, var(--bg-elev) 88%, white 12%))",
				backgroundSize: "220% 100%",
				animation: "skeleton-shimmer 1.15s linear infinite",
				...style,
			}}
		/>
	);
}

export function CardSkeleton() {
	return (
		<div
			style={{
				background: "var(--bg-soft)",
				border: "1px solid var(--border)",
				borderRadius: 14,
				padding: 14,
				display: "grid",
				gap: 10,
			}}
		>
			<Skeleton width="30%" height={12} />
			<Skeleton width="90%" height={14} />
			<Skeleton width="74%" height={14} />
			<Skeleton width="100%" height={120} radius={12} />
		</div>
	);
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
	return (
		<div
			style={{
				border: "1px solid var(--border)",
				background: "var(--bg-soft)",
				borderRadius: 14,
				padding: 12,
				display: "grid",
				gap: 8,
			}}
		>
			{Array.from({ length: rows }).map((_, idx) => (
				<div
					key={`skeleton-row-${idx}`}
					style={{
						display: "grid",
						gridTemplateColumns: "2fr repeat(5, 1fr)",
						gap: 8,
					}}
				>
					<Skeleton height={14} />
					<Skeleton height={14} />
					<Skeleton height={14} />
					<Skeleton height={14} />
					<Skeleton height={14} />
					<Skeleton height={14} />
				</div>
			))}
		</div>
	);
}
