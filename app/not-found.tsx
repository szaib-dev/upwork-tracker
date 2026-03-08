import Link from "next/link";

export default function NotFoundPage() {
	return (
		<div
			style={{
				minHeight: "100vh",
				display: "grid",
				placeItems: "center",
				background: "var(--bg)",
				color: "var(--text)",
				padding: 16,
			}}
		>
			<div
				style={{
					maxWidth: 460,
					width: "100%",
					background: "var(--bg-soft)",
					border: "1px solid var(--border)",
					borderRadius: 14,
					padding: 16,
				}}
			>
				<div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
					Page not found
				</div>
				<div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
					The page you requested does not exist.
				</div>
				<Link
					href="/"
					style={{
						display: "inline-flex",
						alignItems: "center",
						background: "var(--bg-elev)",
						border: "1px solid var(--border)",
						color: "var(--text)",
						borderRadius: 9,
						padding: "8px 10px",
						textDecoration: "none",
					}}
				>
					Go Home
				</Link>
			</div>
		</div>
	);
}
