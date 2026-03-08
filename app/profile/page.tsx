"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
	const { session } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const initialName = useMemo(
		() =>
			String(
				session?.user?.user_metadata?.full_name ??
					session?.user?.user_metadata?.name ??
					"",
			),
		[session?.user?.user_metadata],
	);
	const [name, setName] = useState(initialName);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string>("");
	const [error, setError] = useState<string>("");

	useEffect(() => {
		if (session) return;
		router.replace(`/?next=${encodeURIComponent(pathname || "/profile")}`);
	}, [session, router, pathname]);

	const saveProfile = async () => {
		const nextName = name.trim();
		if (!nextName) {
			setError("Name is required.");
			setMessage("");
			return;
		}
		setSaving(true);
		setError("");
		setMessage("");
		const { error: updateError } = await supabase.auth.updateUser({
			data: { full_name: nextName, name: nextName },
		});
		setSaving(false);
		if (updateError) {
			setError(updateError.message || "Unable to update profile.");
			return;
		}
		setMessage("Profile updated.");
	};

	const isDirty = name.trim() !== initialName.trim();

	const avatarInitials = (name || session?.user?.email || "?")
		.split(" ")
		.map((w) => w[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();

	if (!session) return null;

	return (
		<div
			style={{
				minHeight: "100vh",
				background: "var(--bg)",
				color: "var(--text)",
			}}
		>
			<AppHeader />
			<main
				style={{ maxWidth: 560, margin: "0 auto", padding: "24px 14px 40px" }}
			>
				{/* Avatar + identity block */}
				<div style={identityBlock}>
					<div style={avatarStyle}>{avatarInitials}</div>
					<div>
						<div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>
							{name || "Your Profile"}
						</div>
						<div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
							{session.user.email}
						</div>
					</div>
				</div>

				{/* Form card */}
				<section style={card}>
					<div style={cardHeader}>
						<span style={cardTitle}>Account Details</span>
					</div>

					<div style={{ display: "grid", gap: 14, padding: "14px 16px 16px" }}>
						{/* Name field */}
						<div>
							<label style={labelStyle}>Display Name</label>
							<input
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									setError("");
									setMessage("");
								}}
								style={inputStyle}
								placeholder="Your name"
							/>
						</div>

						{/* Email field */}
						<div>
							<label style={labelStyle}>Email</label>
							<div style={emailField}>
								{session.user.email || ""}
								<span style={emailBadge}>read only</span>
							</div>
						</div>

						{/* Feedback */}
						{error && (
							<div
								style={feedbackStyle(
									"var(--danger)",
									"color-mix(in srgb, var(--danger) 10%, transparent)",
								)}
							>
								{error}
							</div>
						)}
						{message && (
							<div
								style={feedbackStyle(
									"var(--success)",
									"color-mix(in srgb, var(--success) 10%, transparent)",
								)}
							>
								{message}
							</div>
						)}

						{/* Save button */}
						<button
							onClick={() => void saveProfile()}
							disabled={saving || !isDirty}
							style={{
								...saveBtn,
								opacity: saving || !isDirty ? 0.5 : 1,
								cursor: saving || !isDirty ? "not-allowed" : "pointer",
							}}
						>
							{saving ? "Saving..." : "Save Changes"}
						</button>
					</div>
				</section>
			</main>
		</div>
	);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const identityBlock: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: 14,
	marginBottom: 16,
	padding: "0 2px",
};

const avatarStyle: React.CSSProperties = {
	width: 48,
	height: 48,
	borderRadius: 999,
	background: "color-mix(in srgb, var(--primary) 20%, var(--bg-soft))",
	color: "var(--primary)",
	fontSize: 16,
	fontWeight: 800,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	flexShrink: 0,
	border: "2px solid color-mix(in srgb, var(--primary) 30%, var(--border))",
	letterSpacing: "0.02em",
};

const card: React.CSSProperties = {
	background: "var(--bg-soft)",
	border: "1px solid var(--border)",
	borderRadius: 14,
	overflow: "hidden",
};

const cardHeader: React.CSSProperties = {
	padding: "12px 16px",
	borderBottom: "1px solid var(--border)",
	background: "var(--bg-elev)",
};

const cardTitle: React.CSSProperties = {
	fontSize: 11,
	fontWeight: 700,
	color: "var(--muted)",
	textTransform: "uppercase",
	letterSpacing: "0.08em",
};

const labelStyle: React.CSSProperties = {
	display: "block",
	fontSize: 11,
	color: "var(--muted)",
	fontWeight: 600,
	marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
	width: "100%",
	background: "var(--bg-elev)",
	border: "1px solid var(--border)",
	borderRadius: 9,
	color: "var(--text)",
	fontSize: 13,
	padding: "9px 11px",
	boxSizing: "border-box",
	outline: "none",
	fontFamily: "inherit",
};

const emailField: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	background: "var(--bg-elev)",
	border: "1px solid var(--border)",
	borderRadius: 9,
	color: "var(--muted)",
	fontSize: 13,
	padding: "9px 11px",
	opacity: 0.8,
	gap: 8,
};

const emailBadge: React.CSSProperties = {
	fontSize: 10,
	fontWeight: 600,
	color: "var(--muted)",
	background: "var(--bg-soft)",
	border: "1px solid var(--border)",
	borderRadius: 999,
	padding: "2px 7px",
	flexShrink: 0,
};

function feedbackStyle(color: string, bg: string): React.CSSProperties {
	return {
		fontSize: 12,
		color,
		background: bg,
		border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
		borderRadius: 8,
		padding: "8px 10px",
	};
}

const saveBtn: React.CSSProperties = {
	background: "var(--primary)",
	color: "#02111a",
	border: "none",
	borderRadius: 9,
	height: 36,
	padding: "0 16px",
	fontWeight: 700,
	fontSize: 13,
	alignSelf: "flex-start",
};
