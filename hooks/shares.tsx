"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AnalyticsShare, ShareVisibility } from "@/lib/types/share";

type CreateShareInput = {
	title: string;
	visibility: ShareVisibility;
	emails: string[];
};

type UseAnalyticsSharesResult = {
	shares: AnalyticsShare[];
	loading: boolean;
	creating: boolean;
	createShare: (
		input: CreateShareInput,
	) => Promise<{ ok: boolean; error?: string; token?: string }>;
	deleteShare: (shareId: string) => Promise<{ ok: boolean; error?: string }>;
};

function normalizeEmails(emails: string[]): string[] {
	return Array.from(
		new Set(
			emails
				.map((item) => item.trim().toLowerCase())
				.filter((item) => item.includes("@") && item.includes(".")),
		),
	);
}

type ShareRow = {
	id: string;
	token: string;
	title: string;
	visibility: ShareVisibility;
	is_active: boolean;
	created_at: string;
};

type MemberRow = {
	share_id: string;
	email: string;
};

export function useAnalyticsShares(
	userId?: string | null,
): UseAnalyticsSharesResult {
	const [shares, setShares] = useState<AnalyticsShare[]>([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);

	const fetchShares = useCallback(async () => {
		if (!userId) {
			setShares([]);
			setLoading(false);
			return;
		}

		setLoading(true);
		const { data: shareRows, error: shareError } = await supabase
			.from("analytics_shares")
			.select("id, token, title, visibility, is_active, created_at")
			.eq("owner_user_id", userId)
			.order("created_at", { ascending: false });

		if (shareError) {
			setLoading(false);
			return;
		}

		const shareData = (shareRows ?? []) as ShareRow[];
		const ids = shareData.map((row) => row.id);

		let memberMap: Record<string, string[]> = {};
		if (ids.length > 0) {
			const { data: memberRows } = await supabase
				.from("analytics_share_members")
				.select("share_id, email")
				.in("share_id", ids);

			memberMap = ((memberRows ?? []) as MemberRow[]).reduce<
				Record<string, string[]>
			>((acc, row) => {
				if (!acc[row.share_id]) acc[row.share_id] = [];
				acc[row.share_id].push(row.email);
				return acc;
			}, {});
		}

		setShares(
			shareData.map((row) => ({
				id: row.id,
				token: row.token,
				title: row.title,
				visibility: row.visibility,
				isActive: row.is_active,
				createdAt: row.created_at,
				allowedEmails: memberMap[row.id] ?? [],
			})),
		);
		setLoading(false);
	}, [userId]);

	useEffect(() => {
		const frame = window.requestAnimationFrame(() => {
			void fetchShares();
		});
		return () => window.cancelAnimationFrame(frame);
	}, [fetchShares]);

	const createShare = useCallback(
		async (input: CreateShareInput) => {
			if (!userId) return { ok: false, error: "User is not authenticated." };
			setCreating(true);

			const cleanedEmails = normalizeEmails(input.emails);
			if (input.visibility === "private" && cleanedEmails.length === 0) {
				setCreating(false);
				return {
					ok: false,
					error: "Private share requires at least one allowed email.",
				};
			}
			const { data: shareRow, error: shareError } = await supabase
				.from("analytics_shares")
				.insert([
					{
						owner_user_id: userId,
						title: input.title.trim() || "Shared Analytics",
						visibility: input.visibility,
						is_active: true,
					},
				])
				.select("id, token")
				.single();

			if (shareError || !shareRow) {
				setCreating(false);
				return {
					ok: false,
					error: shareError?.message || "Failed to create share link.",
				};
			}

			if (input.visibility === "private" && cleanedEmails.length > 0) {
				const payload = cleanedEmails.map((email) => ({
					share_id: shareRow.id,
					email,
				}));
				const { error: memberError } = await supabase
					.from("analytics_share_members")
					.insert(payload);
				if (memberError) {
					await supabase
						.from("analytics_shares")
						.delete()
						.eq("id", shareRow.id);
					setCreating(false);
					return { ok: false, error: memberError.message };
				}
			}

			await fetchShares();
			setCreating(false);
			return { ok: true, token: shareRow.token as string };
		},
		[fetchShares, userId],
	);

	const deleteShare = useCallback(async (shareId: string) => {
		const { error } = await supabase
			.from("analytics_shares")
			.delete()
			.eq("id", shareId);
		if (error) return { ok: false, error: error.message };
		setShares((curr) => curr.filter((share) => share.id !== shareId));
		return { ok: true };
	}, []);

	return useMemo(
		() => ({
			shares,
			loading,
			creating,
			createShare,
			deleteShare,
		}),
		[shares, loading, creating, createShare, deleteShare],
	);
}
