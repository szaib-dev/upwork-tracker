import React, { useEffect, useRef, useState } from "react";
import ProposalExpanded from "./ProposalExpanded";
import { STATUSES, STATUS_COLORS } from "./Filters";
import { Proposal } from "@/lib/types/proposal";
import { FaHeart, FaRegHeart, FaTrash } from "react-icons/fa";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { useToast } from "@/components/ui/ToastProvider";

function SmallToggle({
	value,
	onChange,
}: {
	value: boolean;
	onChange: (next: boolean) => void;
}) {
	return (
		<button
			onClick={(e) => {
				e.stopPropagation();
				onChange(!value);
			}}
			style={{
				background: value ? "var(--primary-soft)" : "var(--bg-elev)",
				color: value ? "var(--primary)" : "var(--muted)",
				border: `1px solid ${value ? "var(--primary)" : "var(--border)"}`,
				borderRadius: 5,
				padding: "2px 8px",
				fontSize: 11,
			}}
		>
			{value ? "YES" : "NO"}
		</button>
	);
}

function StatusBadge({
	status,
	onChange,
}: {
	status: Proposal["status"];
	onChange: (next: Proposal["status"]) => void;
}) {
	const [open, setOpen] = useState(false);
	const [hoverTrigger, setHoverTrigger] = useState(false);
	const [hoverItem, setHoverItem] = useState<Proposal["status"] | null>(null);
	const rootRef = useRef<HTMLDivElement | null>(null);
	const c = STATUS_COLORS[status] || STATUS_COLORS.Sent;

	useEffect(() => {
		const onDocDown = (event: MouseEvent) => {
			if (!rootRef.current) return;
			if (!rootRef.current.contains(event.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", onDocDown);
		return () => document.removeEventListener("mousedown", onDocDown);
	}, []);

	return (
		<div
			ref={rootRef}
			style={{ position: "relative", display: "inline-block" }}
		>
			<button
				onClick={(e) => {
					e.stopPropagation();
					setOpen((o) => !o);
				}}
				onMouseEnter={() => setHoverTrigger(true)}
				onMouseLeave={() => setHoverTrigger(false)}
				style={{
					background: hoverTrigger
						? `color-mix(in srgb, ${c.bg} 72%, ${c.dot} 28%)`
						: c.bg,
					color: c.text,
					border: `1px solid ${hoverTrigger ? `${c.dot}aa` : `${c.dot}55`}`,
					borderRadius: 6,
					padding: "3px 8px",
					fontSize: 12,
					transition:
						"background-color 0.14s ease, border-color 0.14s ease, transform 0.14s ease",
					transform: hoverTrigger ? "translateY(-1px)" : "none",
				}}
			>
				{status}
			</button>
			{open && (
				<div
					style={{
						position: "absolute",
						top: "110%",
						left: 0,
						zIndex: 100,
						background: "var(--bg-soft)",
						border: "1px solid var(--border)",
						borderRadius: 8,
						minWidth: 120,
					}}
				>
					{STATUSES.map((s) => (
						<button
							key={s}
							onClick={(e) => {
								e.stopPropagation();
								onChange(s);
								setOpen(false);
							}}
							onMouseEnter={() => setHoverItem(s)}
							onMouseLeave={() => setHoverItem(null)}
							style={{
								display: "block",
								width: "100%",
								background:
									hoverItem === s
										? `color-mix(in srgb, ${STATUS_COLORS[s].bg} 74%, var(--bg-elev) 26%)`
										: "transparent",
								color: STATUS_COLORS[s].text,
								border: "none",
								padding: "7px 10px",
								textAlign: "left",
								fontSize: 12,
								transition: "background-color 0.14s ease",
							}}
						>
							{s}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

const colStyle = (w: number) => ({ width: w, minWidth: w, padding: "0 10px" });

type ProposalRowProps = {
	p: Proposal;
	isExpanded: boolean;
	onToggleExpand: () => void;
	updateProposal: (
		id: number,
		field: keyof Proposal,
		value: unknown,
	) => Promise<void>;
	deleteProposal: (id: number) => Promise<{ ok: boolean; error?: string }>;
};

function previewText(text: string): string {
	if (!text) return "No preview available";
	return text.length > 250 ? `${text.slice(0, 250)}...` : text;
}

export default function ProposalRow({
	p,
	isExpanded,
	onToggleExpand,
	updateProposal,
	deleteProposal,
}: ProposalRowProps) {
	const { confirm } = useConfirm();
	const { toast } = useToast();

	const handleDelete = async (e: React.MouseEvent) => {
		e.stopPropagation();
		const yes = await confirm(
			"This proposal will be deleted permanently.",
			"Delete proposal?",
		);
		if (!yes) return;
		const result = await deleteProposal(p.id);
		if (!result.ok) {
			toast(result.error || "Failed to delete proposal.", "error");
			return;
		}
		toast("Proposal deleted.", "success");
	};

	return (
		<>
			<tr
				onClick={onToggleExpand}
				style={{
					borderBottom: "1px solid var(--border)",
					verticalAlign: "top",
					cursor: "pointer",
				}}
			>
				<td
					style={{
						...colStyle(340),
						paddingTop: 8,
						paddingBottom: 8,
					}}
				>
					{p.jobUrl ? (
						<a
							href={p.jobUrl}
							target="_blank"
							rel="noreferrer"
							onClick={(e) => e.stopPropagation()}
							className="proposal-link"
							style={{
								display: "inline-block",
								fontSize: 13,
								fontWeight: 700,
								color: "var(--primary)",
								marginBottom: 4,
								textDecoration: "underline",
								textDecorationColor: "transparent",
								textUnderlineOffset: 3,
								transition:
									"color 0.14s ease, text-decoration-color 0.14s ease",
							}}
						>
							{p.jobTitle || "Untitled Proposal"} (open)
						</a>
					) : (
						<div
							style={{
								fontSize: 13,
								fontWeight: 700,
								color: "var(--text)",
								marginBottom: 4,
							}}
						>
							{p.jobTitle || "Untitled Proposal"}
						</div>
					)}
					<div
						style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.45 }}
					>
						{previewText(p.proposalText)}
					</div>
					<div style={{ display: "flex", gap: 6, marginTop: 6 }}>
						<button
							onClick={(e) => {
								e.stopPropagation();
								void updateProposal(p.id, "isSaved", !p.isSaved);
							}}
							style={{
								background: "var(--bg-elev)",
								border: "1px solid var(--border)",
								color: p.isSaved ? "#f04b6a" : "var(--muted)",
								borderRadius: 8,
								padding: "4px 8px",
								fontSize: 12,
							}}
							title={p.isSaved ? "Unsave proposal" : "Save proposal"}
						>
							{p.isSaved ? <FaHeart /> : <FaRegHeart />}
						</button>
						<button
							onClick={(e) => {
								e.stopPropagation();
								onToggleExpand();
							}}
							style={{
								background: "var(--bg-elev)",
								border: "1px solid var(--border)",
								color: "var(--primary)",
								borderRadius: 8,
								padding: "3px 8px",
								fontSize: 11,
							}}
						>
							Go in
						</button>
					</div>
				</td>

				<td
					style={{ ...colStyle(120), paddingTop: 10 }}
					onClick={(e) => e.stopPropagation()}
				>
					<StatusBadge
						status={p.status}
						onChange={(v) => void updateProposal(p.id, "status", v)}
					/>
				</td>

				<td
					style={{
						...colStyle(90),
						fontFamily: "monospace",
						fontSize: 12,
						color: "var(--text)",
						paddingTop: 10,
					}}
				>
					{p.budget ? `$${p.budget}` : "-"}
				</td>
				<td
					style={{
						...colStyle(80),
						fontFamily: "monospace",
						fontSize: 12,
						color: "var(--primary)",
						paddingTop: 10,
					}}
				>
					{p.connects || "-"}
				</td>

				<td
					style={{ ...colStyle(68), paddingTop: 10 }}
					onClick={(e) => e.stopPropagation()}
				>
					<SmallToggle
						value={p.boosted}
						onChange={(v) => void updateProposal(p.id, "boosted", v)}
					/>
				</td>
				<td
					style={{ ...colStyle(62), paddingTop: 10 }}
					onClick={(e) => e.stopPropagation()}
				>
					<SmallToggle
						value={p.loom}
						onChange={(v) => void updateProposal(p.id, "loom", v)}
					/>
				</td>
				<td
					style={{ ...colStyle(70), paddingTop: 10 }}
					onClick={(e) => e.stopPropagation()}
				>
					<SmallToggle
						value={p.viewed}
						onChange={(v) => void updateProposal(p.id, "viewed", v)}
					/>
				</td>
				<td
					style={{ ...colStyle(60), paddingTop: 10 }}
					onClick={(e) => e.stopPropagation()}
				>
					<SmallToggle
						value={p.lead}
						onChange={(v) => void updateProposal(p.id, "lead", v)}
					/>
				</td>

				<td
					style={{
						...colStyle(100),
						fontFamily: "monospace",
						fontSize: 12,
						color: "var(--muted)",
						paddingTop: 10,
					}}
				>
					{p.dateSent?.slice(5).replace("-", "/")}
				</td>
				<td
					style={{
						...colStyle(130),
						fontSize: 12,
						color: "var(--muted)",
						paddingTop: 10,
					}}
				>
					{p.followUpAt ? new Date(p.followUpAt).toLocaleString() : "-"}
				</td>

				<td
					style={{ ...colStyle(80), paddingTop: 10 }}
					onClick={(e) => e.stopPropagation()}
				>
					<button
						onClick={handleDelete}
						style={{
							background: "transparent",
							border: "1px solid var(--border)",
							color: "var(--danger)",
							borderRadius: 8,
							padding: "4px 8px",
						}}
					>
						<FaTrash />
					</button>
				</td>
			</tr>

			{isExpanded && <ProposalExpanded p={p} updateProposal={updateProposal} />}
			<style>{`
        .proposal-link:hover {
          text-decoration-color: currentColor !important;
          color: color-mix(in srgb, var(--primary) 80%, var(--text) 20%) !important;
        }
      `}</style>
		</>
	);
}
