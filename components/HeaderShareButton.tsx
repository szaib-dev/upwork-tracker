"use client";
import { useState } from "react";
import {
	HiOutlineClipboardDocument,
	HiOutlineGlobeAlt,
	HiOutlineLockClosed,
	HiOutlineShare,
	HiXMark,
} from "react-icons/hi2";
import { useAnalyticsShares } from "@/hooks/shares";
import { ShareVisibility } from "@/lib/types/share";
import { useToast } from "@/components/ui/ToastProvider";

function splitEmails(raw: string): string[] {
	return raw
		.split(/[\n,;\s]+/g)
		.map((item) => item.trim().toLowerCase())
		.filter(Boolean);
}

export default function HeaderShareButton({
	userId,
	className,
}: {
	userId: string;
	className?: string;
}) {
	const { creating, createShare } = useAnalyticsShares(userId);
	const { toast } = useToast();
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState("Team Dashboard Access");
	const [visibility, setVisibility] = useState<ShareVisibility>("public");
	const [emailInput, setEmailInput] = useState("");
	const [emails, setEmails] = useState<string[]>([]);
	const [createdLink, setCreatedLink] = useState("");

	const addEmailsFromRaw = (raw: string) => {
		const parsed = splitEmails(raw);
		if (!parsed.length) return;
		setEmails((curr) => {
			const set = new Set(curr);
			parsed.forEach((email) => set.add(email));
			return Array.from(set);
		});
	};

	const removeEmail = (email: string) => {
		setEmails((curr) => curr.filter((e) => e !== email));
	};

	const copyToClipboard = async (link: string) => {
		try {
			await navigator.clipboard.writeText(link);
			toast("Link copied to clipboard.", "success");
		} catch {
			toast("Copy failed. Link is visible to copy manually.", "error");
		}
	};

	const handleCreate = async () => {
		if (visibility === "private" && emailInput.trim()) {
			addEmailsFromRaw(emailInput);
			setEmailInput("");
		}

		const result = await createShare({ title, visibility, emails });
		if (!result.ok) {
			toast(result.error || "Failed to create link.", "error");
			return;
		}
		const link = `${window.location.origin}/shared/${result.token}`;
		setCreatedLink(link);
		await copyToClipboard(link);
	};

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				aria-label="Share"
				title="Share"
				style={iconBtn}
				className={className}
			>
				<HiOutlineShare />
			</button>

			{open && (
				<div style={overlayStyle}>
					<div onClick={() => setOpen(false)} style={backdropStyle} />
					<div style={modalStyle}>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								gap: 8,
								marginBottom: 12,
							}}
						>
							<div>
								<div style={{ fontSize: 20, fontWeight: 800 }}>
									Share Dashboard
								</div>
								<div
									style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}
								>
									Create public/private access link.
								</div>
							</div>
							<button onClick={() => setOpen(false)} style={ghostBtn}>
								Close
							</button>
						</div>

						<div style={{ display: "grid", gap: 10 }}>
							<input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Link title"
								style={field}
							/>

							<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
								<button
									onClick={() => setVisibility("public")}
									style={toggleBtn(visibility === "public")}
								>
									<HiOutlineGlobeAlt /> Public
								</button>
								<button
									onClick={() => setVisibility("private")}
									style={toggleBtn(visibility === "private")}
								>
									<HiOutlineLockClosed /> Private
								</button>
							</div>

							{visibility === "private" && (
								<div style={chipBox}>
									<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
										{emails.map((email) => (
											<span key={email} style={chipStyle}>
												{email}
												<button
													onClick={() => removeEmail(email)}
													style={chipCloseBtn}
													aria-label={`Remove ${email}`}
												>
													<HiXMark />
												</button>
											</span>
										))}
										<input
											value={emailInput}
											onChange={(e) => setEmailInput(e.target.value)}
											onKeyDown={(e) => {
												if (["Enter", " ", ",", ";"].includes(e.key)) {
													e.preventDefault();
													if (!emailInput.trim()) return;
													addEmailsFromRaw(emailInput);
													setEmailInput("");
													return;
												}
												if (
													e.key === "Backspace" &&
													!emailInput &&
													emails.length
												) {
													removeEmail(emails[emails.length - 1]);
												}
											}}
											onBlur={() => {
												if (!emailInput.trim()) return;
												addEmailsFromRaw(emailInput);
												setEmailInput("");
											}}
											onPaste={(e) => {
												const raw = e.clipboardData.getData("text");
												if (!raw) return;
												if (!/[\s,;\n]/.test(raw)) return;
												e.preventDefault();
												addEmailsFromRaw(raw);
											}}
											placeholder={
												emails.length
													? "Add more emails"
													: "Type email and press space"
											}
											style={chipInput}
										/>
									</div>
								</div>
							)}

							<button
								onClick={() => void handleCreate()}
								disabled={creating}
								style={createBtn}
							>
								{creating ? "Creating..." : "Create Link"}
							</button>

							{createdLink && (
								<div
									style={{
										border: "1px solid var(--border)",
										background: "var(--bg-elev)",
										borderRadius: 10,
										padding: 10,
									}}
								>
									<div
										style={{
											fontSize: 11,
											color: "var(--muted)",
											textTransform: "uppercase",
											letterSpacing: "0.08em",
											marginBottom: 6,
										}}
									>
										Created Link
									</div>
									<div
										style={{ display: "flex", gap: 8, alignItems: "center" }}
									>
										<input
											readOnly
											value={createdLink}
											style={{ ...field, padding: "8px 10px" }}
										/>
										<button
											onClick={() => void copyToClipboard(createdLink)}
											style={ghostBtn}
											title="Copy"
										>
											<HiOutlineClipboardDocument />
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	);
}

const overlayStyle: React.CSSProperties = {
	position: "fixed",
	inset: 0,
	zIndex: 180,
	display: "grid",
	placeItems: "center",
	padding: 14,
};

const backdropStyle: React.CSSProperties = {
	position: "absolute",
	inset: 0,
	background: "color-mix(in srgb, #050607 50%, transparent)",
	backdropFilter: "blur(14px) saturate(135%)",
	WebkitBackdropFilter: "blur(14px) saturate(135%)",
};

const modalStyle: React.CSSProperties = {
	position: "relative",
	width: "100%",
	maxWidth: 560,
	background: "color-mix(in srgb, var(--bg-soft) 80%, transparent)",
	border: "1px solid color-mix(in srgb, var(--border) 70%, #ffffff22)",
	borderRadius: 16,
	padding: 16,
	boxShadow: "0 24px 70px rgba(0,0,0,0.42)",
	backdropFilter: "blur(22px)",
	WebkitBackdropFilter: "blur(22px)",
};

const iconBtn: React.CSSProperties = {
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	background: "var(--bg-elev)",
	border: "1px solid var(--border)",
	color: "var(--text)",
	borderRadius: 9,
	width: 36,
	height: 36,
	cursor: "pointer",
	fontSize: 18,
	transition:
		"background-color 0.16s ease, border-color 0.16s ease, transform 0.16s ease",
};

const field: React.CSSProperties = {
	background: "var(--bg-elev)",
	border: "1px solid var(--border)",
	borderRadius: 9,
	color: "var(--text)",
	padding: "10px 11px",
	fontSize: 13,
	width: "100%",
	outline: "none",
	boxSizing: "border-box",
};

const chipBox: React.CSSProperties = {
	...field,
	padding: 8,
	minHeight: 48,
};

const chipStyle: React.CSSProperties = {
	display: "inline-flex",
	alignItems: "center",
	gap: 6,
	background: "var(--bg-soft)",
	border: "1px solid var(--border)",
	color: "var(--text)",
	borderRadius: 999,
	padding: "5px 9px",
	fontSize: 12,
};

const chipCloseBtn: React.CSSProperties = {
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	width: 16,
	height: 16,
	borderRadius: 999,
	border: "1px solid var(--border)",
	background: "transparent",
	color: "var(--muted)",
	cursor: "pointer",
	padding: 0,
};

const chipInput: React.CSSProperties = {
	flex: "1 0 170px",
	minWidth: 140,
	border: "none",
	outline: "none",
	background: "transparent",
	color: "var(--text)",
	fontSize: 13,
	padding: "6px 4px",
};

function toggleBtn(active: boolean): React.CSSProperties {
	return {
		display: "inline-flex",
		alignItems: "center",
		gap: 6,
		background: active ? "var(--primary-soft)" : "var(--bg-elev)",
		border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
		color: active ? "var(--primary)" : "var(--text)",
		borderRadius: 9,
		padding: "8px 10px",
		fontSize: 12,
		cursor: "pointer",
	};
}

const createBtn: React.CSSProperties = {
	background: "var(--primary)",
	color: "#11161d",
	border: "1px solid color-mix(in srgb, var(--primary) 70%, var(--border))",
	borderRadius: 9,
	padding: "10px 12px",
	fontWeight: 800,
	cursor: "pointer",
};

const ghostBtn: React.CSSProperties = {
	background: "var(--bg-elev)",
	border: "1px solid var(--border)",
	color: "var(--text)",
	borderRadius: 9,
	padding: "8px 10px",
	cursor: "pointer",
};
