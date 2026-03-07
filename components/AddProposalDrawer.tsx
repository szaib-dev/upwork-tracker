import React, { useState } from "react";
import { STATUSES, STATUS_COLORS } from "./Filters";
import { emptyProposalInput, ProposalInput } from "@/lib/types/proposal";

const inputStyle = {
	background: "var(--bg-elev)",
	border: "1px solid var(--border)",
	borderRadius: 9,
	color: "var(--text)",
	fontSize: 13,
	padding: "9px 12px",
	width: "100%",
	outline: "none",
	boxSizing: "border-box" as const,
};

function DrawerField({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div style={{ marginBottom: 12 }}>
			<label
				style={{
					display: "block",
					fontSize: 10,
					color: "var(--muted)",
					letterSpacing: "0.09em",
					textTransform: "uppercase",
					marginBottom: 6,
				}}
			>
				{label}
			</label>
			{children}
		</div>
	);
}

export function Toggle({
	label,
	value,
	onChange,
	color = "var(--primary)",
}: {
	label: string;
	value: boolean;
	onChange: (next: boolean) => void;
	color?: string;
}) {
	return (
		<button
			type="button"
			onClick={() => onChange(!value)}
			style={{
				display: "flex",
				justifyContent: "space-between",
				width: "100%",
				background: value ? `${color}22` : "var(--bg-elev)",
				border: `1px solid ${value ? color : "var(--border)"}`,
				borderRadius: 8,
				padding: "7px 10px",
				color: value ? color : "var(--muted)",
				cursor: "pointer",
			}}
		>
			<span style={{ fontSize: 12 }}>{label}</span>
			<span style={{ fontSize: 11 }}>{value ? "YES" : "NO"}</span>
		</button>
	);
}

type AddProposalDrawerProps = {
	closeDrawer: () => void;
	addProposal: (
		input: Partial<ProposalInput>,
	) => Promise<{ ok: boolean; error?: string }>;
};

async function guessTitle(url: string): Promise<string> {
	if (!url) return "";
	try {
		const response = await fetch("/api/extract-title", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ url }),
		});
		const data = (await response.json()) as { title?: string };
		return data.title?.trim() || "";
	} catch {
		return "";
	}
}

export default function AddProposalDrawer({
	closeDrawer,
	addProposal,
}: AddProposalDrawerProps) {
	const [form, setForm] = useState<ProposalInput>({
		...emptyProposalInput,
		dateSent: new Date().toISOString().slice(0, 10),
	});
	const [saving, setSaving] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const handleAutoTitle = async () => {
		if (!form.jobUrl || form.jobTitle.trim()) return;
		const title = await guessTitle(form.jobUrl);
		if (title) setForm((f) => ({ ...f, jobTitle: title }));
	};

	const handleSubmit = async () => {
		setSaving(true);
		setSubmitError(null);

		const result = await addProposal({
			...form,
			budget: Number(form.budget) || 0,
			connects: Number(form.connects) || 0,
			status: form.status || "Sent",
			dateSent: form.dateSent || new Date().toISOString().slice(0, 10),
		});

		setSaving(false);
		if (!result.ok) {
			setSubmitError(result.error ?? "Unable to save proposal.");
			return;
		}
		closeDrawer();
	};

	return (
		<div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
			<div
				onClick={closeDrawer}
				style={{ position: "absolute", inset: 0, background: "#00000066" }}
			/>
			<div
				style={{
					position: "absolute",
					right: 0,
					top: 0,
					bottom: 0,
					width: 460,
					maxWidth: "100%",
					background: "var(--bg-soft)",
					borderLeft: "1px solid var(--border)",
					overflowY: "auto",
					padding: 18,
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 12,
					}}
				>
					<div style={{ fontSize: 16, fontWeight: 800 }}>Add Proposal</div>
					<button
						onClick={closeDrawer}
						style={{
							background: "none",
							border: "none",
							color: "var(--muted)",
							fontSize: 20,
							cursor: "pointer",
						}}
					>
						x
					</button>
				</div>

				<DrawerField label="Date Sent">
					<input
						type="date"
						value={form.dateSent}
						onChange={(e) =>
							setForm((f) => ({ ...f, dateSent: e.target.value }))
						}
						style={inputStyle}
					/>
				</DrawerField>

				<DrawerField label="Job URL">
					<input
						type="url"
						value={form.jobUrl}
						onChange={(e) => setForm((f) => ({ ...f, jobUrl: e.target.value }))}
						onBlur={handleAutoTitle}
						placeholder="Paste job URL"
						style={inputStyle}
					/>
				</DrawerField>

				<DrawerField label="Job Title (auto-filled from metadata)">
					<input
						type="text"
						value={form.jobTitle}
						onChange={(e) =>
							setForm((f) => ({ ...f, jobTitle: e.target.value }))
						}
						placeholder="Optional"
						style={inputStyle}
					/>
				</DrawerField>

				<DrawerField label="Country">
					<input
						type="text"
						value={form.clientCountry}
						onChange={(e) =>
							setForm((f) => ({ ...f, clientCountry: e.target.value }))
						}
						placeholder="Client country"
						style={inputStyle}
					/>
				</DrawerField>

				<div
					style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
				>
					<DrawerField label="Pricing ($)">
						<input
							type="number"
							value={String(form.budget)}
							onChange={(e) =>
								setForm((f) => ({ ...f, budget: Number(e.target.value) || 0 }))
							}
							style={inputStyle}
						/>
					</DrawerField>
					<DrawerField label="Connects">
						<input
							type="number"
							value={String(form.connects)}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									connects: Number(e.target.value) || 0,
								}))
							}
							style={inputStyle}
						/>
					</DrawerField>
				</div>

				<DrawerField label="Status">
					<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
						{STATUSES.map((s) => {
							const c = STATUS_COLORS[s];
							const active = form.status === s;
							return (
								<button
									key={s}
									type="button"
									onClick={() => setForm((f) => ({ ...f, status: s }))}
									style={{
										background: active ? c.bg : "var(--bg-elev)",
										color: active ? c.text : "var(--muted)",
										border: `1px solid ${active ? c.dot : "var(--border)"}`,
										borderRadius: 8,
										padding: "5px 9px",
										fontSize: 12,
										cursor: "pointer",
									}}
								>
									{s}
								</button>
							);
						})}
					</div>
				</DrawerField>

				<DrawerField label="Flags">
					<div
						style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}
					>
						<Toggle
							label="Boosted"
							value={form.boosted}
							onChange={(v) => setForm((f) => ({ ...f, boosted: v }))}
							color="#ff9d5c"
						/>
						<Toggle
							label="Loom"
							value={form.loom}
							onChange={(v) => setForm((f) => ({ ...f, loom: v }))}
							color="var(--primary)"
						/>
						<Toggle
							label="Viewed"
							value={form.viewed}
							onChange={(v) => setForm((f) => ({ ...f, viewed: v }))}
							color="#ffd06b"
						/>
						<Toggle
							label="Lead"
							value={form.lead}
							onChange={(v) => setForm((f) => ({ ...f, lead: v }))}
							color="#32db98"
						/>
					</div>
				</DrawerField>

				<DrawerField label="Proposal Text">
					<textarea
						value={form.proposalText}
						onChange={(e) =>
							setForm((f) => ({ ...f, proposalText: e.target.value }))
						}
						style={{ ...inputStyle, minHeight: 120 }}
					/>
				</DrawerField>

				{submitError && (
					<div
						style={{
							color: "var(--danger)",
							background: "color-mix(in srgb, var(--danger) 16%, transparent)",
							border: "1px solid var(--danger)",
							borderRadius: 8,
							padding: 9,
							fontSize: 12,
							marginBottom: 8,
						}}
					>
						{submitError}
					</div>
				)}

				<button
					onClick={handleSubmit}
					disabled={saving}
					style={{
						background: "var(--primary)",
						color: "#04141f",
						border: "none",
						borderRadius: 9,
						width: "100%",
						padding: "11px",
						fontWeight: 700,
						cursor: saving ? "default" : "pointer",
						opacity: saving ? 0.7 : 1,
					}}
				>
					{saving ? "Saving..." : "Save Proposal"}
				</button>
			</div>
		</div>
	);
}
