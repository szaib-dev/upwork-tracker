"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
	FaChevronDown,
	FaChevronUp,
	FaLink,
	FaRegCommentDots,
} from "react-icons/fa";
import { HiXMark } from "react-icons/hi2";
import { Proposal } from "@/lib/types/proposal";
import CustomDropdown from "@/components/ui/CustomDropdown";
import SharedProposalFeedback from "@/components/shared/SharedProposalFeedback";

type SharedProposalTableProps = {
	proposals: Proposal[];
	token: string;
};

function previewText(text: string): string {
	if (!text) return "No preview available";
	return text.length > 250 ? `${text.slice(0, 250)}...` : text;
}

function normalizeLink(raw: string): string {
	if (!raw) return "";
	if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
	return `https://${raw}`;
}

function getClientLink(p: Proposal): string {
	return normalizeLink(
		p.socials?.chat ||
			p.socials?.upwork ||
			p.socials?.website ||
			p.socials?.linkedin ||
			p.socials?.twitter ||
			"",
	);
}

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export default function SharedProposalTable({
	proposals,
	token,
}: SharedProposalTableProps) {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [expandedId, setExpandedId] = useState<number | null>(null);
	const [commentProposal, setCommentProposal] = useState<Proposal | null>(null);

	const totalPages = Math.max(1, Math.ceil(proposals.length / pageSize));
	const currentData = useMemo(() => {
		const safePage = Math.min(page, totalPages);
		const start = (safePage - 1) * pageSize;
		return proposals.slice(start, start + pageSize);
	}, [proposals, page, pageSize, totalPages]);

	useEffect(() => {
		if (typeof document === "undefined") return;
		if (!commentProposal) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previous;
		};
	}, [commentProposal]);

	const modal =
		commentProposal && typeof document !== "undefined"
			? createPortal(
					<div className="shared-modal-overlay">
						<div
							className="shared-modal-backdrop"
							onClick={() => setCommentProposal(null)}
						/>
						<div className="shared-modal" onClick={(e) => e.stopPropagation()}>
							<div className="shared-modal-head">
								<div>
									<div className="shared-modal-title">Comments</div>
									<div className="shared-modal-sub">
										{commentProposal.jobTitle || "Untitled Proposal"}
									</div>
								</div>
								<button
									type="button"
									onClick={() => setCommentProposal(null)}
									className="shared-modal-close"
								>
									<HiXMark />
								</button>
							</div>
							<div className="shared-modal-body">
								<div className="shared-modal-proposal">
									{commentProposal.proposalText || "No proposal text."}
								</div>
								<SharedProposalFeedback
									token={token}
									proposalId={commentProposal.id}
									mode="comments-only"
								/>
							</div>
						</div>
					</div>,
					document.body,
				)
			: null;

	return (
		<div className="shared-wrap">
			{/* Top bar */}
			<div className="shared-topbar">
				<div style={{ color: "var(--muted)", fontSize: 12 }}>
					Showing {currentData.length} of {proposals.length} proposals
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
						flexWrap: "wrap",
					}}
				>
					<CustomDropdown
						value={String(pageSize)}
						onChange={(v) => {
							setPageSize(Number(v));
							setPage(1);
						}}
						options={PAGE_SIZE_OPTIONS.map((size) => ({
							value: String(size),
							label: `${size} / page`,
						}))}
						width={128}
					/>
					<button
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page <= 1}
						style={pagerBtn(page <= 1)}
					>
						Prev
					</button>
					<span style={{ color: "var(--muted)", fontSize: 12 }}>
						Page {Math.min(page, totalPages)} / {totalPages}
					</span>
					<button
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page >= totalPages}
						style={pagerBtn(page >= totalPages)}
					>
						Next
					</button>
				</div>
			</div>

			{/* Cards */}
			<div className="shared-cards">
				{currentData.map((p) => {
					const clientLink = getClientLink(p);
					const isExpanded = expandedId === p.id;

					return (
						<div
							key={p.id}
							className={`shared-card ${isExpanded ? "open" : ""}`}
							onClick={() => setExpandedId(isExpanded ? null : p.id)}
						>
							{/* Row 1: title + status badge */}
							<div className="shared-card-top">
								<div className="shared-card-title-row">
									{p.jobUrl ? (
										<a
											href={p.jobUrl}
											target="_blank"
											rel="noreferrer"
											onClick={(e) => e.stopPropagation()}
											className="shared-link"
										>
											{p.jobTitle || "Untitled Proposal"}
										</a>
									) : (
										<span className="shared-link-plain">
											{p.jobTitle || "Untitled Proposal"}
										</span>
									)}
								</div>
								<span className="shared-status">{p.status}</span>
							</div>

							{/* Row 2: preview text */}
							<div
								className="shared-preview"
								style={
									isExpanded
										? {
												whiteSpace: "pre-wrap",
												WebkitLineClamp: "unset",
												display: "block",
											}
										: undefined
								}
							>
								{isExpanded
									? p.proposalText || "No proposal text."
									: previewText(p.proposalText)}
							</div>

							{/* Row 3: meta pills in one horizontal row */}
							<div className="shared-meta-row">
								{p.budget ? (
									<span className="meta-pill">${p.budget}</span>
								) : null}
								{p.connects ? (
									<span className="meta-pill">{p.connects} connects</span>
								) : null}
								{p.dateSent ? (
									<span className="meta-pill">
										{p.dateSent.slice(5).replace("-", "/")}
									</span>
								) : null}
								{clientLink ? (
									<a
										href={clientLink}
										target="_blank"
										rel="noreferrer"
										onClick={(e) => e.stopPropagation()}
										className="meta-pill meta-pill-link"
									>
										<FaLink size={10} /> {p.clientName || "Client"}
									</a>
								) : p.clientName ? (
									<span className="meta-pill">{p.clientName}</span>
								) : null}
								<span
									className="meta-pill meta-pill-toggle"
									style={{ marginLeft: "auto" }}
								>
									{isExpanded ? (
										<FaChevronUp size={10} />
									) : (
										<FaChevronDown size={10} />
									)}
									{isExpanded ? "Collapse" : "Expand"}
								</span>
							</div>

							{/* Expanded: reactions + comment button */}
							{isExpanded && (
								<div
									onClick={(e) => e.stopPropagation()}
									style={{ marginTop: 10 }}
								>
									<SharedProposalFeedback
										token={token}
										proposalId={p.id}
										mode="reactions-only"
										onOpenComments={() => setCommentProposal(p)}
									/>
									<div style={{ marginTop: 8 }}>
										<button
											type="button"
											onClick={() => setCommentProposal(p)}
											className="shared-comment-btn"
										>
											<FaRegCommentDots /> Comment
										</button>
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{modal}

			<style>{`
        .shared-wrap {
          border: 1px solid var(--border);
          background: var(--bg-soft);
          border-radius: 14px;
          padding: 12px;
          min-width: 0;
        }
        .shared-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          gap: 8px;
          flex-wrap: wrap;
        }
        .shared-cards {
          display: grid;
          gap: 8px;
        }

        /* Card */
        .shared-card {
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--bg-elev);
          padding: 12px 14px;
          cursor: pointer;
          transition: border-color 0.14s ease, box-shadow 0.14s ease;
        }
        .shared-card:hover {
          border-color: color-mix(in srgb, var(--primary) 35%, var(--border));
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        .shared-card.open {
          border-color: color-mix(in srgb, var(--primary) 45%, var(--border));
        }

        /* Title row */
        .shared-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 6px;
        }
        .shared-card-title-row {
          min-width: 0;
          flex: 1;
        }
        .shared-link {
          color: var(--text);
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          line-height: 1.35;
          word-break: break-word;
        }
        .shared-link:hover {
          color: var(--primary);
        }
        .shared-link-plain {
          color: var(--text);
          font-weight: 700;
          font-size: 14px;
          line-height: 1.35;
          word-break: break-word;
        }

        /* Status badge */
        .shared-status {
          display: inline-flex;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 2px 9px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text);
          background: var(--bg-soft);
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Preview */
        .shared-preview {
          color: var(--muted);
          font-size: 12px;
          line-height: 1.55;
          word-break: break-word;
          white-space: normal;
          margin-bottom: 10px;
        }

        /* Meta row */
        .shared-meta-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--muted);
          background: var(--bg-soft);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 3px 8px;
          white-space: nowrap;
        }
        .meta-pill-link {
          color: var(--primary);
          text-decoration: none;
        }
        .meta-pill-link:hover {
          border-color: color-mix(in srgb, var(--primary) 50%, var(--border));
        }
        .meta-pill-toggle {
          color: var(--text);
          gap: 5px;
        }

        /* Comment button */
        .shared-comment-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-soft);
          color: var(--text);
          font-size: 12px;
          padding: 6px 10px;
          cursor: pointer;
        }

        /* Modal */
        .shared-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 240;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px;
        }
        .shared-modal-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(4,6,10,0.72);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
        }
        .shared-modal {
          position: relative;
          width: min(920px, 100%);
          max-height: 90vh;
          overflow: auto;
          border-radius: 16px;
          border: 1px solid var(--border);
          background: var(--bg-soft);
          box-shadow: 0 28px 80px rgba(0,0,0,0.48);
          padding: 16px;
        }
        .shared-modal-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }
        .shared-modal-title {
          font-size: 16px;
          font-weight: 800;
        }
        .shared-modal-sub {
          color: var(--muted);
          font-size: 12px;
          margin-top: 3px;
        }
        .shared-modal-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--border);
          background: var(--bg-elev);
          color: var(--text);
          border-radius: 8px;
          cursor: pointer;
          font-size: 17px;
          flex-shrink: 0;
        }
        .shared-modal-body {}
        .shared-modal-proposal {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px;
          background: var(--bg-elev);
          white-space: pre-wrap;
          font-size: 13px;
          line-height: 1.55;
          margin-bottom: 12px;
          color: var(--text);
        }

	        @media (max-width: 600px) {
	          .shared-status {
	            display: none;
	          }
	          .shared-card {
	            padding: 11px 12px;
	          }
	          .shared-card-top {
	            margin-bottom: 8px;
	          }
	          .shared-meta-row {
	            gap: 4px;
	          }
	          .meta-pill-toggle {
	            margin-left: 0 !important;
          }
        }
      `}</style>
		</div>
	);
}

function pagerBtn(disabled: boolean): React.CSSProperties {
	return {
		background: "var(--bg-elev)",
		border: "1px solid var(--border)",
		color: disabled ? "var(--muted)" : "var(--text)",
		borderRadius: 8,
		padding: "6px 10px",
		fontSize: 12,
		cursor: disabled ? "default" : "pointer",
	};
}
