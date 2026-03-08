"use client";

import { useEffect } from "react";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div
			style={{
				minHeight: "100vh",
				display: "grid",
				placeItems: "center",
				padding: 16,
				background: "var(--bg)",
				color: "var(--text)",
			}}
		>
			<div
				style={{
					width: "100%",
					maxWidth: 460,
					border: "1px solid var(--border)",
					background: "var(--bg-soft)",
					borderRadius: 14,
					padding: 16,
				}}
			>
				<div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
					Something went wrong
				</div>
				<div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>
					Unexpected runtime error occurred. Please retry.
				</div>
				<button
					type="button"
					onClick={reset}
					style={{
						background: "var(--bg-elev)",
						border: "1px solid var(--border)",
						borderRadius: 9,
						padding: "8px 10px",
						color: "var(--text)",
						cursor: "pointer",
					}}
				>
					Retry
				</button>
			</div>
		</div>
	);
}
