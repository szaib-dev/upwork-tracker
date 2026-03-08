"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FaRegCommentDots, FaRegHeart, FaReply } from "react-icons/fa";
import { BiLike } from "react-icons/bi";
import { PiHandsClapping } from "react-icons/pi";
import { AiOutlineFire } from "react-icons/ai";
import { HiXMark } from "react-icons/hi2";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type FeedbackRow = {
	id: number;
	parent_feedback_id: number | null;
	author_name: string;
	content: string;
	created_at: string;
	reactions: Record<string, number>;
};

type ProposalReactionRow = {
	emoji: string;
	reaction_count: number;
};

type SharedProposalFeedbackProps = {
	token: string;
	proposalId: number;
	mode?: "full" | "reactions-only" | "comments-only";
	onOpenComments?: () => void;
};

const REACTIONS = [
	{ key: "like", label: "Like", icon: BiLike },
	{ key: "love", label: "Love", icon: FaRegHeart },
	{ key: "clap", label: "Clap", icon: PiHandsClapping },
	{ key: "fire", label: "Fire", icon: AiOutlineFire },
] as const;

function getViewerId() {
	if (typeof window === "undefined") return "";
	const key = "upt_share_viewer_id";
	const existing = window.localStorage.getItem(key);
	if (existing) return existing;
	const created =
		typeof crypto !== "undefined" && "randomUUID" in crypto
			? crypto.randomUUID()
			: `${Date.now()}-${Math.random().toString(36).slice(2)}`;
	window.localStorage.setItem(key, created);
	return created;
}

function fmt(ts: string) {
	if (!ts) return "";
	return new Date(ts).toLocaleString();
}

function reactionStorageKey(
	token: string,
	proposalId: number,
	viewerId: string,
) {
	return `upt_reactions_${token}_${proposalId}_${viewerId}`;
}

function getPersistedReaction(
	token: string,
	proposalId: number,
	viewerId: string,
) {
	if (typeof window === "undefined") return "";
	const raw = window.localStorage.getItem(
		reactionStorageKey(token, proposalId, viewerId),
	);
	return raw || "";
}

function saveReaction(
	token: string,
	proposalId: number,
	viewerId: string,
	reaction: string,
) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(
		reactionStorageKey(token, proposalId, viewerId),
		reaction,
	);
}

function commentReactionStorageKey(
	token: string,
	proposalId: number,
	viewerId: string,
	feedbackId: number,
) {
	return `upt_comment_reaction_${token}_${proposalId}_${viewerId}_${feedbackId}`;
}

function getPersistedCommentReaction(
	token: string,
	proposalId: number,
	viewerId: string,
	feedbackId: number,
) {
	if (typeof window === "undefined") return "";
	return (
		window.localStorage.getItem(
			commentReactionStorageKey(token, proposalId, viewerId, feedbackId),
		) || ""
	);
}

function savePersistedCommentReaction(
	token: string,
	proposalId: number,
	viewerId: string,
	feedbackId: number,
	reaction: string,
) {
	if (typeof window === "undefined") return;
	const key = commentReactionStorageKey(
		token,
		proposalId,
		viewerId,
		feedbackId,
	);
	if (!reaction) {
		window.localStorage.removeItem(key);
		return;
	}
	window.localStorage.setItem(key, reaction);
}

export default function SharedProposalFeedback({
	token,
	proposalId,
	mode = "full",
	onOpenComments,
}: SharedProposalFeedbackProps) {
	const { session } = useAuth();
	const [items, setItems] = useState<FeedbackRow[]>([]);
	const [proposalReactions, setProposalReactions] = useState<
		Record<string, number>
	>({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [author, setAuthor] = useState("");
	const [content, setContent] = useState("");
	const [replyToId, setReplyToId] = useState<number | null>(null);
	const [replyContent, setReplyContent] = useState("");
	const [viewerId] = useState(() => getViewerId());
	const [myProposalReaction, setMyProposalReaction] = useState("");
	const [myCommentReactionById, setMyCommentReactionById] = useState<
		Record<number, string>
	>({});
	const [showLoginPrompt, setShowLoginPrompt] = useState(false);

	const showProposalReactions = mode !== "comments-only";
	const showComments = mode !== "reactions-only";

	const loadFeedback = useCallback(async () => {
		if (!token || !proposalId) return;
		setLoading(true);
		setError("");

		const feedbackResult = await supabase.rpc("get_shared_proposal_feedback", {
			p_token: token,
			p_proposal_id: proposalId,
		});
		if (feedbackResult.error) {
			setError(feedbackResult.error.message || "Unable to load feedback.");
			setLoading(false);
			return;
		}
		const incoming = (feedbackResult.data as FeedbackRow[] | null) ?? [];
		const deduped = new Map<number, FeedbackRow>();
		for (const row of incoming) deduped.set(row.id, row);
		const sorted = Array.from(deduped.values()).sort(
			(a, b) =>
				new Date(a.created_at).getTime() - new Date(b.created_at).getTime() ||
				a.id - b.id,
		);
		setItems(sorted);

		const reactionResult = await supabase.rpc("get_shared_proposal_reactions", {
			p_token: token,
			p_proposal_id: proposalId,
		});
		if (!reactionResult.error) {
			const next: Record<string, number> = {};
			for (const row of (reactionResult.data as ProposalReactionRow[] | null) ??
				[]) {
				next[row.emoji] = Number(row.reaction_count || 0);
			}
			setProposalReactions(next);
		}

		setLoading(false);
	}, [token, proposalId]);

	useEffect(() => {
		setMyProposalReaction(getPersistedReaction(token, proposalId, viewerId));
	}, [token, proposalId, viewerId]);

	useEffect(() => {
		const next: Record<number, string> = {};
		for (const item of items) {
			next[item.id] = getPersistedCommentReaction(
				token,
				proposalId,
				viewerId,
				item.id,
			);
		}
		setMyCommentReactionById(next);
	}, [items, token, proposalId, viewerId]);

	useEffect(() => {
		if (!session) return;
		const meta = (session.user.user_metadata || {}) as Record<string, unknown>;
		const fullName =
			(typeof meta.full_name === "string" && meta.full_name.trim()) ||
			(typeof meta.name === "string" && meta.name.trim()) ||
			"";
		if (fullName) {
			setAuthor(fullName);
			return;
		}
		const emailName = (session.user.email || "").split("@")[0]?.trim();
		if (emailName) setAuthor(emailName);
	}, [session]);

	useEffect(() => {
		void loadFeedback();
	}, [loadFeedback]);

	useEffect(() => {
		const channel = supabase
			.channel(`shared-feedback-${token}-${proposalId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "analytics_share_feedback",
					filter: `proposal_id=eq.${proposalId}`,
				},
				() => {
					void loadFeedback();
				},
			)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "analytics_share_proposal_reactions",
					filter: `proposal_id=eq.${proposalId}`,
				},
				() => {
					void loadFeedback();
				},
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [token, proposalId, loadFeedback]);

	useEffect(() => {
		if (!showLoginPrompt || typeof document === "undefined") return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [showLoginPrompt]);

	const comments = useMemo(
		() => items.filter((item) => item.parent_feedback_id == null),
		[items],
	);

	const repliesByParent = useMemo(() => {
		const map: Record<number, FeedbackRow[]> = {};
		for (const item of items) {
			if (item.parent_feedback_id == null) continue;
			if (!map[item.parent_feedback_id]) map[item.parent_feedback_id] = [];
			map[item.parent_feedback_id].push(item);
		}
		for (const k of Object.keys(map)) {
			map[Number(k)].sort(
				(a, b) =>
					new Date(a.created_at).getTime() - new Date(b.created_at).getTime() ||
					a.id - b.id,
			);
		}
		return map;
	}, [items]);

	const addFeedback = async (parentId: number | null, text: string) => {
		if (!text.trim()) return;
		if (!session && !author.trim()) {
			setError("Please enter your name before posting a comment.");
			return;
		}
		if (parentId != null && !session) {
			setShowLoginPrompt(true);
			return;
		}

		const optimisticId = -Math.floor(Math.random() * 1000000) - 1;
		const resolvedAuthor = session
			? author.trim() ||
				session.user.user_metadata?.full_name ||
				session.user.user_metadata?.name ||
				(session.user.email || "").split("@")[0] ||
				"User"
			: author.trim() || "Guest";
		const optimistic: FeedbackRow = {
			id: optimisticId,
			parent_feedback_id: parentId,
			author_name: String(resolvedAuthor).slice(0, 80),
			content: text.trim(),
			created_at: new Date().toISOString(),
			reactions: {},
		};

		setItems((curr) => [...curr, optimistic]);
		if (parentId == null) setContent("");
		if (parentId != null) setReplyContent("");
		setReplyToId(null);

		const { error: rpcError } = await supabase.rpc(
			"add_shared_proposal_feedback",
			{
				p_token: token,
				p_proposal_id: proposalId,
				p_author_name: String(resolvedAuthor),
				p_content: text.trim(),
				p_parent_feedback_id: parentId,
			},
		);

		if (rpcError) {
			setItems((curr) => curr.filter((row) => row.id !== optimisticId));
			setError(rpcError.message || "Unable to send feedback.");
			return;
		}

		setError("");
		void loadFeedback();
	};

	const toggleCommentReaction = async (
		feedbackId: number,
		reactionKey: string,
	) => {
		if (!viewerId) return;
		const prev = myCommentReactionById[feedbackId] || "";

		setItems((curr) =>
			curr.map((row) => {
				if (row.id !== feedbackId) return row;
				const nextReactions = { ...(row.reactions || {}) };
				if (prev)
					nextReactions[prev] = Math.max(0, (nextReactions[prev] || 0) - 1);
				if (prev !== reactionKey)
					nextReactions[reactionKey] = (nextReactions[reactionKey] || 0) + 1;
				return { ...row, reactions: nextReactions };
			}),
		);

		const nextSelected = prev === reactionKey ? "" : reactionKey;
		setMyCommentReactionById((curr) => ({
			...curr,
			[feedbackId]: nextSelected,
		}));
		savePersistedCommentReaction(
			token,
			proposalId,
			viewerId,
			feedbackId,
			nextSelected,
		);

		if (prev) {
			const offResult = await supabase.rpc(
				"toggle_shared_proposal_feedback_reaction",
				{
					p_token: token,
					p_feedback_id: feedbackId,
					p_reactor_id: viewerId,
					p_emoji: prev,
				},
			);
			if (offResult.error) {
				setError(offResult.error.message || "Unable to react.");
				void loadFeedback();
				return;
			}
		}

		if (prev !== reactionKey) {
			const onResult = await supabase.rpc(
				"toggle_shared_proposal_feedback_reaction",
				{
					p_token: token,
					p_feedback_id: feedbackId,
					p_reactor_id: viewerId,
					p_emoji: reactionKey,
				},
			);
			if (onResult.error) {
				setError(onResult.error.message || "Unable to react.");
				void loadFeedback();
				return;
			}
		}

		setError("");
	};

	const toggleProposalReaction = async (reactionKey: string) => {
		if (!viewerId) return;
		const prev = myProposalReaction;
		const next = prev === reactionKey ? "" : reactionKey;
		setProposalReactions((curr) => {
			const patch = { ...curr };
			if (prev) patch[prev] = Math.max(0, (patch[prev] || 0) - 1);
			if (next) patch[next] = (patch[next] || 0) + 1;
			return patch;
		});
		setMyProposalReaction(next);
		saveReaction(token, proposalId, viewerId, next);

		if (prev) {
			const offResult = await supabase.rpc("toggle_shared_proposal_reaction", {
				p_token: token,
				p_proposal_id: proposalId,
				p_reactor_id: viewerId,
				p_emoji: prev,
			});
			if (offResult.error) {
				setError(offResult.error.message || "Unable to react on proposal.");
				void loadFeedback();
				return;
			}
		}
		if (next) {
			const onResult = await supabase.rpc("toggle_shared_proposal_reaction", {
				p_token: token,
				p_proposal_id: proposalId,
				p_reactor_id: viewerId,
				p_emoji: next,
			});
			if (onResult.error) {
				setError(onResult.error.message || "Unable to react on proposal.");
				void loadFeedback();
				return;
			}
		}
		setError("");
	};

	const handleReplyIntent = (commentId: number) => {
		if (!session) {
			setShowLoginPrompt(true);
			return;
		}
		setReplyToId((prev) => (prev === commentId ? null : commentId));
	};

	const loginModal = showLoginPrompt ? (
		<div style={loginOverlay}>
			<div style={loginBackdrop} onClick={() => setShowLoginPrompt(false)} />
			<div style={loginCard}>
				<div style={loginHead}>
					<div style={{ fontWeight: 800, fontSize: 16 }}>Login Required</div>
					<button
						type="button"
						onClick={() => setShowLoginPrompt(false)}
						style={closeBtn}
					>
						<HiXMark />
					</button>
				</div>
				<div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
					Please login to reply to comments. Public comments are still open with
					a name.
				</div>
				<div
					style={{
						display: "flex",
						justifyContent: "flex-end",
						gap: 8,
						marginTop: 10,
					}}
				>
					<button
						type="button"
						onClick={() => setShowLoginPrompt(false)}
						style={ghostBtn}
					>
						Close
					</button>
					<button
						type="button"
						onClick={() => {
							if (typeof window !== "undefined") {
								const next = encodeURIComponent(window.location.pathname);
								window.location.href = `/shared-signin?next=${next}`;
							}
						}}
						style={btn}
					>
						Go To Login
					</button>
				</div>
			</div>
		</div>
	) : null;

	if (mode === "reactions-only") {
		return (
			<>
				<div
					style={{
						marginTop: 10,
						borderTop: "1px solid var(--border)",
						paddingTop: 10,
					}}
				>
					<div
						style={{
							display: "flex",
							gap: 6,
							marginBottom: 8,
							flexWrap: "wrap",
						}}
					>
						{REACTIONS.map((reaction) => {
							const Icon = reaction.icon;
							const active = myProposalReaction === reaction.key;
							return (
								<button
									key={`proposal-${reaction.key}`}
									onClick={() => void toggleProposalReaction(reaction.key)}
									style={{
										...reactBtn,
										borderColor: active ? "var(--primary)" : "var(--border)",
									}}
								>
									<Icon /> {proposalReactions[reaction.key] || 0}
								</button>
							);
						})}
						<button type="button" onClick={onOpenComments} style={reactBtn}>
							<FaRegCommentDots /> {comments.length}
						</button>
					</div>
					{error && (
						<div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>
					)}
				</div>
				{loginModal}
			</>
		);
	}

	return (
		<>
			<div
				style={{
					marginTop: mode === "comments-only" ? 0 : 10,
					border: "1px solid var(--border)",
					borderRadius: 12,
					padding: 12,
					background: "var(--bg-elev)",
				}}
			>
				{showProposalReactions && (
					<>
						<div style={headingStyle}>React on proposal</div>
						<div
							style={{
								display: "flex",
								gap: 6,
								marginBottom: 12,
								flexWrap: "wrap",
							}}
						>
							{REACTIONS.map((reaction) => {
								const Icon = reaction.icon;
								const active = myProposalReaction === reaction.key;
								return (
									<button
										key={`proposal-${reaction.key}`}
										onClick={() => void toggleProposalReaction(reaction.key)}
										style={{
											...reactBtn,
											borderColor: active ? "var(--primary)" : "var(--border)",
										}}
									>
										<Icon /> {proposalReactions[reaction.key] || 0}
									</button>
								);
							})}
						</div>
					</>
				)}

				{showComments && (
					<>
						<div style={headingStyle}>Comments</div>
						<div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
							{!session ? (
								<input
									value={author}
									onChange={(e) => setAuthor(e.target.value)}
									placeholder="Your name"
									style={field}
								/>
							) : null}
							<textarea
								value={content}
								onChange={(e) => setContent(e.target.value)}
								placeholder="Write a comment"
								style={{ ...field, minHeight: 70, resize: "vertical" as const }}
							/>
							<button
								onClick={() => void addFeedback(null, content)}
								style={btn}
							>
								Post Comment
							</button>
						</div>

						{loading ? (
							<div style={{ color: "var(--muted)", fontSize: 12 }}>
								Loading comments...
							</div>
						) : comments.length === 0 ? (
							<div style={{ color: "var(--muted)", fontSize: 12 }}>
								No comments yet.
							</div>
						) : (
							<div style={{ display: "grid", gap: 10 }}>
								{comments.map((item) => (
									<div
										key={item.id}
										style={{
											border: "1px solid var(--border)",
											borderRadius: 10,
											padding: 10,
										}}
									>
										<div style={{ fontSize: 12, fontWeight: 700 }}>
											{item.author_name}
										</div>
										<div
											style={{
												fontSize: 11,
												color: "var(--muted)",
												marginTop: 2,
											}}
										>
											{fmt(item.created_at)}
										</div>
										<div
											style={{
												marginTop: 7,
												whiteSpace: "pre-wrap",
												fontSize: 13,
											}}
										>
											{item.content}
										</div>
										<div
											style={{
												display: "flex",
												gap: 6,
												marginTop: 8,
												flexWrap: "wrap",
											}}
										>
											{REACTIONS.map((reaction) => {
												const Icon = reaction.icon;
												return (
													<button
														key={`${item.id}-${reaction.key}`}
														onClick={() =>
															void toggleCommentReaction(item.id, reaction.key)
														}
														style={{
															...reactBtn,
															borderColor:
																myCommentReactionById[item.id] === reaction.key
																	? "var(--primary)"
																	: "var(--border)",
														}}
													>
														<Icon /> {item.reactions?.[reaction.key] || 0}
													</button>
												);
											})}
											<button
												onClick={() => handleReplyIntent(item.id)}
												style={reactBtn}
											>
												<FaReply /> Reply
											</button>
										</div>

										{repliesByParent[item.id]?.length ? (
											<div style={{ marginTop: 8, display: "grid", gap: 6 }}>
												{repliesByParent[item.id].map((reply) => (
													<div
														key={reply.id}
														style={{
															borderLeft: "2px solid var(--border)",
															paddingLeft: 8,
															fontSize: 12,
														}}
													>
														<div style={{ fontWeight: 700 }}>
															{reply.author_name}
														</div>
														<div
															style={{ color: "var(--muted)", fontSize: 11 }}
														>
															{fmt(reply.created_at)}
														</div>
														<div style={{ whiteSpace: "pre-wrap" }}>
															{reply.content}
														</div>
													</div>
												))}
											</div>
										) : null}

										{replyToId === item.id && (
											<div style={{ marginTop: 8, display: "grid", gap: 6 }}>
												<textarea
													value={replyContent}
													onChange={(e) => setReplyContent(e.target.value)}
													placeholder="Write a reply"
													style={{
														...field,
														minHeight: 60,
														resize: "vertical" as const,
													}}
												/>
												<button
													onClick={() =>
														void addFeedback(item.id, replyContent)
													}
													style={btn}
												>
													Post Reply
												</button>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</>
				)}

				{error && (
					<div style={{ marginTop: 8, color: "var(--danger)", fontSize: 12 }}>
						{error}
					</div>
				)}
			</div>
			{loginModal}
		</>
	);
}

const headingStyle: React.CSSProperties = {
	fontSize: 11,
	color: "var(--muted)",
	textTransform: "uppercase",
	letterSpacing: "0.08em",
	marginBottom: 8,
};

const field: React.CSSProperties = {
	background: "var(--bg-soft)",
	border: "1px solid var(--border)",
	color: "var(--text)",
	borderRadius: 8,
	padding: "8px 10px",
	fontSize: 12,
	width: "100%",
	outline: "none",
};

const btn: React.CSSProperties = {
	background: "var(--primary)",
	color: "#11161d",
	border: "1px solid color-mix(in srgb, var(--primary) 70%, var(--border))",
	borderRadius: 8,
	padding: "7px 10px",
	fontSize: 12,
	fontWeight: 700,
	cursor: "pointer",
};

const ghostBtn: React.CSSProperties = {
	background: "var(--bg-soft)",
	color: "var(--text)",
	border: "1px solid var(--border)",
	borderRadius: 8,
	padding: "7px 10px",
	fontSize: 12,
	fontWeight: 600,
	cursor: "pointer",
};

const reactBtn: React.CSSProperties = {
	display: "inline-flex",
	alignItems: "center",
	gap: 5,
	background: "var(--bg-soft)",
	border: "1px solid var(--border)",
	borderRadius: 999,
	padding: "5px 8px",
	fontSize: 12,
	color: "var(--text)",
	cursor: "pointer",
};

const loginOverlay: React.CSSProperties = {
	position: "fixed",
	inset: 0,
	zIndex: 300,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	padding: 14,
};

const loginBackdrop: React.CSSProperties = {
	position: "absolute",
	inset: 0,
	background: "rgba(6, 8, 12, 0.64)",
	backdropFilter: "blur(16px)",
	WebkitBackdropFilter: "blur(16px)",
};

const loginCard: React.CSSProperties = {
	position: "relative",
	width: "min(420px, 100%)",
	borderRadius: 14,
	border: "1px solid color-mix(in srgb, var(--border) 62%, #ffffff33)",
	background: "color-mix(in srgb, var(--bg-soft) 72%, transparent)",
	backdropFilter: "blur(22px) saturate(150%)",
	WebkitBackdropFilter: "blur(22px) saturate(150%)",
	boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
	padding: 12,
};

const loginHead: React.CSSProperties = {
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	gap: 10,
	marginBottom: 6,
};

const closeBtn: React.CSSProperties = {
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	width: 30,
	height: 30,
	border: "1px solid var(--border)",
	background: "var(--bg-elev)",
	color: "var(--text)",
	borderRadius: 8,
	cursor: "pointer",
	fontSize: 18,
};
