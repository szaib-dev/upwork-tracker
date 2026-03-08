"use client";
import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import AppHeader from "@/components/AppHeader";
import { useProposals } from "@/hooks/proposal";
import ProposalTable from "@/components/ProposalTable";

export default function SavedProposalsPage() {
	const { session } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const { proposals, loading, updateProposal, deleteProposal } = useProposals(
		session?.user?.id,
	);
	useEffect(() => {
		if (session) return;
		router.replace(`/?next=${encodeURIComponent(pathname || "/saved")}`);
	}, [session, router, pathname]);

	const saved = useMemo(() => proposals.filter((p) => p.isSaved), [proposals]);

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
			<div style={{ padding: 10 }} className="saved-main">
				<div
					style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gap: 10 }}
				>
					<div
						style={{
							border: "1px solid var(--border)",
							background: "var(--bg-soft)",
							borderRadius: 12,
							padding: 12,
						}}
					>
						<div style={{ fontSize: 20, fontWeight: 800 }}>Saved Proposals</div>
						<div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
							Hearted proposals are stored here.
						</div>
					</div>

					{loading ? (
						<div style={{ color: "var(--muted)" }}>
							Loading saved proposals...
						</div>
					) : (
						<ProposalTable
							filteredProposals={saved}
							updateProposal={updateProposal}
							deleteProposal={deleteProposal}
						/>
					)}
				</div>
			</div>
			<style>{`
        @media (max-width: 900px) {
          .saved-main {
            padding-left: 8px !important;
            padding-right: 8px !important;
            padding-top: 8px !important;
            padding-bottom: 14px !important;
          }
        }
      `}</style>
		</div>
	);
}
