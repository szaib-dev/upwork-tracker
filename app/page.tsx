"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import AppHeader from "@/components/AppHeader";
import Filters from "@/components/Filters";
import AddProposalDrawer from "@/components/AddProposalDrawer";
import MonthDropdown from "@/components/MonthDropdown";
import { useProposals } from "@/hooks/proposal";
import { Proposal } from "@/lib/types/proposal";
import { TableSkeleton } from "@/components/ui/Skeleton";

const DashboardStats = dynamic(
	() => import("@/components/analytics/DashboardStats"),
	{
		loading: () => <TableSkeleton rows={2} />,
	},
);

const ProposalTable = dynamic(() => import("@/components/ProposalTable"), {
	loading: () => <TableSkeleton rows={6} />,
});

type FilterType = "All" | Proposal["status"];

function formatMonthLabel(month: string) {
	return new Date(`${month}-01`).toLocaleString("en-US", {
		month: "short",
		year: "numeric",
	});
}

function buildCountdown(target: Date, nowTs: number) {
	const diff = target.getTime() - nowTs;
	if (diff <= 0) return "Due now";
	const totalSeconds = Math.floor(diff / 1000);
	const d = Math.floor(totalSeconds / 86400);
	const h = Math.floor((totalSeconds % 86400) / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	const s = totalSeconds % 60;
	if (d > 0) return `${d}d ${h}h ${m}m`;
	if (h > 0) return `${h}h ${m}m ${s}s`;
	return `${m}m ${s}s`;
}

export default function ProposalTracker() {
	const { session } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { proposals, loading, updateProposal, addProposal, deleteProposal } =
		useProposals(session?.user?.id);

	const [filter, setFilter] = useState<FilterType>("All");
	const [monthFilter, setMonthFilter] = useState<string>("all");
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [authError, setAuthError] = useState<string | null>(null);
	const [authNotice, setAuthNotice] = useState<string | null>(null);
	const [authLoading, setAuthLoading] = useState(false);
	const [isSignUp, setIsSignUp] = useState(false);
	const [isForgotMode, setIsForgotMode] = useState(false);
	const [isRecoveryMode, setIsRecoveryMode] = useState(false);
	const [nowTs, setNowTs] = useState(() => Date.now());
	const nextAfterLogin = searchParams.get("next");

	useEffect(() => {
		if (!session || !nextAfterLogin) return;
		if (!nextAfterLogin.startsWith("/") || nextAfterLogin.startsWith("//")) return;
		router.replace(nextAfterLogin);
	}, [session, nextAfterLogin, router]);

	useEffect(() => {
		const timer = setInterval(() => setNowTs(Date.now()), 1000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		const setRecoveryFromUrl = () => {
			if (typeof window === "undefined") return;
			const hashParams = new URLSearchParams(
				window.location.hash.replace(/^#/, ""),
			);
			const searchParams = new URLSearchParams(window.location.search);
			const type = hashParams.get("type") ?? searchParams.get("type");
			const recovery = type === "recovery";
			setIsRecoveryMode(recovery);
			if (recovery) {
				setIsForgotMode(false);
				setIsSignUp(false);
			}
		};

		setRecoveryFromUrl();
		window.addEventListener("hashchange", setRecoveryFromUrl);
		window.addEventListener("popstate", setRecoveryFromUrl);
		return () => {
			window.removeEventListener("hashchange", setRecoveryFromUrl);
			window.removeEventListener("popstate", setRecoveryFromUrl);
		};
	}, []);

	const monthOptions = useMemo(
		() =>
			Array.from(
				new Set(proposals.map((p) => p.dateSent.slice(0, 7)).filter(Boolean)),
			).sort((a, b) => b.localeCompare(a)),
		[proposals],
	);
	const monthSelectOptions = useMemo(
		() => [
			{ value: "all", label: "All months" },
			...monthOptions.map((m) => ({ value: m, label: formatMonthLabel(m) })),
		],
		[monthOptions],
	);

	const filtered = useMemo(() => {
		return proposals.filter((p) => {
			const statusMatch = filter === "All" || p.status === filter;
			const monthMatch =
				monthFilter === "all" || p.dateSent.startsWith(monthFilter);
			return statusMatch && monthMatch;
		});
	}, [proposals, filter, monthFilter]);

	const nextFollowUp = useMemo(() => {
		const upcoming = proposals
			.filter((p) => p.followUpAt)
			.map((p) => ({ p, dt: new Date(p.followUpAt) }))
			.filter((x) => x.dt.getTime() > nowTs)
			.sort((a, b) => a.dt.getTime() - b.dt.getTime());
		return upcoming[0] ?? null;
	}, [proposals, nowTs]);

	const showFollowUpBanner =
		!!nextFollowUp && nextFollowUp.dt.getTime() - nowTs <= 24 * 60 * 60 * 1000;

	const handleAuth = async (e: React.FormEvent) => {
		e.preventDefault();
		setAuthLoading(true);
		setAuthError(null);
		setAuthNotice(null);
		try {
			if (isRecoveryMode) {
				if (!password || !confirmPassword) {
					setAuthError("Please enter and confirm your new password.");
					return;
				}
				if (password !== confirmPassword) {
					setAuthError("Passwords do not match.");
					return;
				}
				const { error } = await supabase.auth.updateUser({ password });
				if (error) throw error;
				await supabase.auth.signOut();
				if (typeof window !== "undefined") {
					window.history.replaceState(
						{},
						document.title,
						window.location.pathname,
					);
				}
				setPassword("");
				setConfirmPassword("");
				setIsRecoveryMode(false);
				setAuthNotice("Password updated. Sign in with your new password.");
			} else if (isForgotMode) {
				const redirectTo =
					typeof window !== "undefined" ? window.location.origin : undefined;
				const { error } = await supabase.auth.resetPasswordForEmail(email, {
					redirectTo,
				});
				if (error) throw error;
				setAuthNotice("Password reset link sent. Check your email.");
			} else if (isSignUp) {
				const trimmedName = fullName.trim();
				if (!trimmedName) {
					setAuthError("Name is required.");
					return;
				}
				if (password !== confirmPassword) {
					setAuthError("Passwords do not match.");
					return;
				}
				const { data, error } = await supabase.auth.signUp({
					email,
					password,
					options: {
						data: {
							full_name: trimmedName,
							name: trimmedName,
						},
					},
				});
				if (error) throw error;
				if (!data.session) {
					setAuthNotice(
						"Account created. Check your email to confirm, then sign in.",
					);
				} else {
					setAuthNotice("Account created and signed in.");
				}
			} else {
				const { error } = await supabase.auth.signInWithPassword({
					email,
					password,
				});
				if (error) throw error;
				setAuthNotice("Signed in successfully.");
			}
		} catch (err) {
			setAuthError(
				err instanceof Error ? err.message : "Authentication failed",
			);
		} finally {
			setAuthLoading(false);
		}
	};

	if (!session || isRecoveryMode) {
		return (
			<div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-deep)] text-[var(--text)] font-sans selection:bg-[var(--primary)] selection:text-black">
				<style>{`
                .auth-card {
                    background: var(--bg-elev);
                    border: 1px solid var(--border);
                    border-radius: 28px;
                    padding: clamp(32px, 5vw, 56px);
                    box-shadow: 0 40px 100px -20px rgba(0,0,0,0.7);
                    position: relative;
                }
                /* Glow effect behind the card */
                .auth-card::after {
                    content: '';
                    position: absolute;
                    inset: -1px;
                    background: linear-gradient(135deg, var(--border), transparent, var(--border));
                    border-radius: 28px;
                    z-index: -1;
                    opacity: 0.5;
                }
                .auth-input {
                    width: 100%;
                    background: var(--bg-soft);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 14px 16px;
                    color: var(--text);
                    font-size: 14px;
                    font-weight: 300;
                    outline: none;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .auth-input:focus {
                    border-color: var(--primary);
                    background: var(--bg-elev);
                    box-shadow: 0 0 0 1px var(--primary);
                }
                .auth-input::placeholder { color: var(--muted); opacity: 0.5; }

                .auth-submit {
                    width: 100%;
                    background: var(--primary);
                    color: #0e1217; /* Dark text for primary contrast */
                    font-size: 14px;
                    font-weight: 700;
                    border: none;
                    border-radius: 12px;
                    padding: 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    letter-spacing: -0.01em;
                }
                .auth-submit:hover:not(:disabled) { 
                    opacity: 0.9;
                    transform: translateY(-1px);
                    box-shadow: 0 8px 20px -6px var(--primary);
                }
                .auth-submit:active { transform: translateY(0); }
                .auth-submit:disabled { opacity: 0.4; cursor: not-allowed; }

                .feature-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: var(--muted);
                    font-size: 14px;
                    font-weight: 300;
                    transition: color 0.3s;
                }
                .feature-item:hover { color: var(--text); }
                .feature-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--primary);
                    box-shadow: 0 0 8px var(--primary);
                }
            `}</style>

				<div className="w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 items-center">
					{/* Left Column — Branding */}
					<div className="hidden md:block">
						<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-soft)] border border-[var(--border)] text-[10px] uppercase tracking-[0.15em] text-[var(--primary)] mb-8 font-bold">
							<span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
							Professional Dashboard
						</div>

						<h1 className="text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
							Track proposals <br />
							<span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] via-neutral-200 to-neutral-500">
								like a pro.
							</span>
						</h1>

						<p className="mt-8 text-lg text-[var(--muted)] font-light leading-relaxed max-w-md">
							A high-performance workspace designed for elite freelancers.
							Quiet, fast, and built to close deals.
						</p>

						<div className="mt-12 flex flex-col gap-5">
							{[
								"Proposal tracking & real-time analytics",
								"Automated follow-up scheduling",
								"Integrated client management CRM",
							].map((label) => (
								<div key={label} className="feature-item">
									<span className="feature-dot" />
									{label}
								</div>
							))}
						</div>
					</div>

					{/* Right Column — Auth Card */}
					<div className="auth-card">
						{/* Mobile Branding (only visible on small screens) */}
						<div className="md:hidden mb-8">
							<h1 className="text-4xl font-bold tracking-tight text-white">
								Track <span className="text-[var(--primary)]">pro.</span>
							</h1>
						</div>

						<div className="mb-10">
							<h2 className="text-3xl font-bold text-white tracking-tight">
								{isRecoveryMode
									? "Reset password"
									: isForgotMode
										? "Forgot password"
										: isSignUp
											? "Create account"
											: "Welcome back"}
							</h2>
							<p className="text-[var(--muted)] font-light mt-2 text-sm">
								{isRecoveryMode
									? "Secure your workspace with a new password."
									: isForgotMode
										? "We'll send a recovery link to your inbox."
										: isSignUp
											? "Join the elite freelancer community today."
											: "Please enter your details to continue."}
							</p>
						</div>

						<form onSubmit={handleAuth} className="flex flex-col gap-4">
							{isSignUp && (
								<div className="space-y-1">
									<label className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted)] ml-1">
										Full Name
									</label>
									<input
										value={fullName}
										onChange={(e) => setFullName(e.target.value)}
										type="text"
										required
										placeholder="John Doe"
										className="auth-input"
									/>
								</div>
							)}

							<div className="space-y-1">
								<label className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted)] ml-1">
									Email Address
								</label>
								<input
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									type="email"
									required
									disabled={isRecoveryMode}
									placeholder="name@workspace.com"
									className="auth-input"
								/>
							</div>

							{!isForgotMode && (
								<div className="space-y-1">
									<div className="flex justify-between items-center px-1">
										<label className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted)]">
											Password
										</label>
										{!isSignUp && !isRecoveryMode && (
											<button
												type="button"
												onClick={() => setIsForgotMode(true)}
												className="text-[11px] text-[var(--primary)] hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer"
											>
												Forgot password?
											</button>
										)}
									</div>
									<input
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										type="password"
										required
										placeholder="••••••••"
										className="auth-input"
									/>
								</div>
							)}

							{(isSignUp || isRecoveryMode) && !isForgotMode && (
								<div className="space-y-1">
									<label className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted)] ml-1">
										Confirm Password
									</label>
									<input
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										type="password"
										required
										placeholder="••••••••"
										className="auth-input"
									/>
								</div>
							)}

							{authError && (
								<div className="p-3 mt-2 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] text-xs font-medium flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)]" />
									{authError}
								</div>
							)}

							{authNotice && (
								<div className="p-3 mt-2 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-medium">
									{authNotice}
								</div>
							)}

							<button
								type="submit"
								disabled={authLoading}
								className="auth-submit mt-4"
							>
								{authLoading
									? "Synchronizing..."
									: isRecoveryMode
										? "Update Password"
										: isForgotMode
											? "Send Recovery Link"
											: isSignUp
												? "Create Free Account"
												: "Sign Into Workspace"}
							</button>

							<div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-col items-center">
								<button
									type="button"
									onClick={() => {
										if (isRecoveryMode) setIsRecoveryMode(false);
										if (isForgotMode) setIsForgotMode(false);
										else setIsSignUp((x) => !x);
										setFullName("");
										setPassword("");
										setConfirmPassword("");
										setAuthError(null);
										setAuthNotice(null);
									}}
									className="text-sm text-[var(--muted)] hover:text-white transition-colors bg-transparent border-none cursor-pointer flex items-center gap-2"
								>
									{isRecoveryMode || isForgotMode
										? "← Back to login"
										: isSignUp
											? "Already a member? Sign in"
											: "New to the platform? Create account"}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className="fade-in-up"
			style={{
				minHeight: "100vh",
				background: "var(--bg)",
				color: "var(--text)",
			}}
		>
			<AppHeader onAddProposal={() => setDrawerOpen(true)} />

			<main
				style={{
					width: "100%",
					padding: "10px 10px 20px",
					minWidth: 0,
					maxWidth: 1420,
					margin: "0 auto",
				}}
				className="home-main"
			>
				<section
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						gap: 12,
						flexWrap: "wrap",
						marginBottom: 10,
						padding: "2px 2px 0",
					}}
				>
					<div>
						<div
							style={{ fontSize: 21, fontWeight: 800, letterSpacing: "0.01em" }}
						>
							Home Dashboard
						</div>
						<div style={{ fontSize: 12, color: "var(--muted)" }}>
							{filtered.length} proposals in current view
						</div>
					</div>
					<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
						<div
							style={{
								fontSize: 11,
								color: "var(--muted)",
								textTransform: "uppercase",
								letterSpacing: "0.09em",
							}}
						>
							Month
						</div>
						<MonthDropdown
							value={monthFilter}
							onChange={setMonthFilter}
							options={monthSelectOptions}
							width={240}
						/>
					</div>
				</section>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 12,
						minWidth: 0,
					}}
				>
					{showFollowUpBanner && nextFollowUp && (
						<section
							style={{
								background: "var(--primary-soft)",
								border:
									"1px solid color-mix(in srgb, var(--primary) 55%, var(--border))",
								color: "var(--text)",
								borderRadius: 12,
								padding: "11px 12px",
								fontSize: 13,
							}}
						>
							Next follow-up in{" "}
							<strong>{buildCountdown(nextFollowUp.dt, nowTs)}</strong>:{" "}
							<strong>{nextFollowUp.p.jobTitle || "Untitled"}</strong>
						</section>
					)}

					<div style={{ minWidth: 0 }}>
						<Filters
							currentFilter={filter}
							setFilter={setFilter}
							proposals={proposals}
						/>
					</div>
					<div style={{ minWidth: 0 }} className="home-stats">
						<DashboardStats proposals={filtered} />
					</div>

					{loading ? (
						<TableSkeleton rows={6} />
					) : (
						<div style={{ minWidth: 0 }}>
							<ProposalTable
								filteredProposals={filtered}
								updateProposal={updateProposal}
								deleteProposal={deleteProposal}
							/>
						</div>
					)}
				</div>
			</main>
			<style>{`
        @media (max-width: 900px) {
          .home-main {
            padding-left: 8px !important;
            padding-right: 8px !important;
            padding-top: 8px !important;
            padding-bottom: 14px !important;
          }
        }
        @media (max-width: 640px) {
          .home-stats {
            display: none !important;
          }
        }
      `}</style>

			{drawerOpen && (
				<AddProposalDrawer
					closeDrawer={() => setDrawerOpen(false)}
					addProposal={addProposal}
				/>
			)}
		</div>
	);
}
