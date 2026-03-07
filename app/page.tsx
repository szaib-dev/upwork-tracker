"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import AppHeader from "@/components/AppHeader";
import Filters from "@/components/Filters";
import ProposalTable from "@/components/ProposalTable";
import AddProposalDrawer from "@/components/AddProposalDrawer";
import DashboardStats from "@/components/analytics/DashboardStats";
import MonthDropdown from "@/components/MonthDropdown";
import { useProposals } from "@/hooks/proposal";
import { Proposal } from "@/lib/types/proposal";

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
			<div className="min-h-screen flex items-center justify-center p-5  text-neutral-300 font-sans">
				<style>{`
        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 14px 16px;
          color: #fff;
          font-size: 14px;
          font-weight: 300;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
        }
        .auth-input::placeholder { color: #444; }
        .auth-input:focus {
          border-color: rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.05);
        }
        .auth-input:disabled { opacity: 0.45; cursor: not-allowed; }

        .auth-submit {
          width: 100%;
          background: #fff;
          color: #000;
          font-size: 14px;
          font-weight: 500;
          border: none;
          border-radius: 10px;
          padding: 14px;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s;
          letter-spacing: 0.01em;
        }
        .auth-submit:hover:not(:disabled) { background: #e8e8e8; }
        .auth-submit:disabled { opacity: 0.45; cursor: not-allowed; }

        .auth-link-btn {
          width: 100%;
          background: transparent;
          border: none;
          font-size: 13px;
          color: #555;
          font-weight: 300;
          cursor: pointer;
          padding: 4px 0;
          transition: color 0.18s;
          text-align: center;
        }
        .auth-link-btn:hover { color: #fff; }

        .auth-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 2px 0;
        }

        .auth-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 12px;
          color: #666;
          margin-bottom: 28px;
          letter-spacing: 0.02em;
        }
        .auth-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3a3a3a;
        }
      `}</style>

				<div className="w-full max-w-[1180px] grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
					{/* Left — branding */}
					<div className="hidden md:block">
						<div className="auth-badge">
							<span className="auth-badge-dot" />
							Freelancer dashboard
						</div>

						<h1 className="text-5xl lg:text-6xl font-extralight tracking-tight text-white leading-[1.12]">
							Track proposals
							<br />
							<span style={{ color: "#2a2a2a" }}>like a pro.</span>
						</h1>

						<p className="mt-7 text-base text-neutral-500 font-light leading-relaxed max-w-sm">
							A fast, quiet workspace for proposals, follow-ups, analytics, and
							client tracking — built for freelancers.
						</p>

						<div className="mt-12 flex flex-col gap-3">
							{[
								{ icon: "◎", label: "Proposal tracking & analytics" },
								{ icon: "◷", label: "Follow-up scheduling" },
								{ icon: "◈", label: "Client management" },
							].map((f) => (
								<div key={f.label} className="flex items-center gap-3">
									<span style={{ fontSize: 13, color: "#333" }}>{f.icon}</span>
									<span
										style={{ fontSize: 13, color: "#444", fontWeight: 300 }}
									>
										{f.label}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Right — form card */}
					<div
						style={{
							background: "#0a0a0a",
							border: "1px solid rgba(255,255,255,0.06)",
							borderRadius: 20,
							padding: "clamp(24px, 5vw, 40px)",
							boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
						}}
					>
						{/* Mobile heading */}
						<div className="md:hidden mb-6">
							<h1 className="text-3xl font-extralight tracking-tight text-white">
								Track proposals
								<br />
								<span style={{ color: "#2a2a2a" }}>like a pro.</span>
							</h1>
						</div>

						<div style={{ marginBottom: 24 }}>
							<h2
								style={{
									fontSize: 20,
									fontWeight: 300,
									color: "#fff",
									margin: 0,
									letterSpacing: "-0.01em",
								}}
							>
								{isRecoveryMode
									? "Reset password"
									: isForgotMode
										? "Forgot password"
										: isSignUp
											? "Create an account"
											: "Welcome back"}
							</h2>
							<p
								style={{
									fontSize: 13,
									color: "#444",
									marginTop: 5,
									fontWeight: 300,
								}}
							>
								{isRecoveryMode
									? "Enter a new password below."
									: isForgotMode
										? "We'll send a reset link to your email."
										: isSignUp
											? "Get started for free."
											: "Sign in to your workspace."}
							</p>
						</div>

						<form
							onSubmit={handleAuth}
							style={{ display: "flex", flexDirection: "column", gap: 10 }}
						>
							{isSignUp && (
								<input
									value={fullName}
									onChange={(e) => setFullName(e.target.value)}
									type="text"
									required
									placeholder="Full name"
									className="auth-input"
								/>
							)}

							<input
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								type="email"
								required
								disabled={isRecoveryMode}
								placeholder="Email address"
								className="auth-input"
							/>

							{!isForgotMode && (
								<input
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									type="password"
									required
									placeholder={isRecoveryMode ? "New password" : "Password"}
									className="auth-input"
								/>
							)}

							{(isSignUp || isRecoveryMode) && !isForgotMode && (
								<input
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									type="password"
									required
									placeholder="Confirm password"
									className="auth-input"
								/>
							)}

							{authError && (
								<div
									style={{
										fontSize: 13,
										color: "#f87171",
										fontWeight: 300,
										padding: "8px 12px",
										background: "rgba(248,113,113,0.07)",
										border: "1px solid rgba(248,113,113,0.15)",
										borderRadius: 8,
									}}
								>
									{authError}
								</div>
							)}
							{authNotice && (
								<div
									style={{
										fontSize: 13,
										color: "#a3a3a3",
										fontWeight: 300,
										padding: "8px 12px",
										background: "rgba(255,255,255,0.04)",
										border: "1px solid rgba(255,255,255,0.08)",
										borderRadius: 8,
									}}
								>
									{authNotice}
								</div>
							)}

							<button
								type="submit"
								disabled={authLoading}
								className="auth-submit"
								style={{ marginTop: 6 }}
							>
								{authLoading
									? "Please wait..."
									: isRecoveryMode
										? "Update Password"
										: isForgotMode
											? "Send Reset Link"
											: isSignUp
												? "Create Account"
												: "Sign In"}
							</button>

							<div className="auth-divider" style={{ marginTop: 6 }} />

							{!isSignUp && !isForgotMode && !isRecoveryMode && (
								<button
									type="button"
									onClick={() => {
										setIsForgotMode(true);
										setAuthError(null);
										setAuthNotice(null);
									}}
									className="auth-link-btn"
								>
									Forgot password?
								</button>
							)}

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
								className="auth-link-btn"
							>
								{isRecoveryMode
									? "Back to sign in"
									: isForgotMode
										? "Back to sign in"
										: isSignUp
											? "Already have an account? Sign in"
											: "Don't have an account? Sign up"}
							</button>
						</form>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className=""
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
					<div style={{ minWidth: 0 }}>
						<DashboardStats proposals={filtered} />
					</div>

					{loading ? (
						<div
							style={{
								background: "var(--bg-soft)",
								border: "1px solid var(--border)",
								borderRadius: 14,
								padding: "14px",
								color: "var(--muted)",
							}}
						>
							Loading proposals...
						</div>
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

const authInput: React.CSSProperties = {
	background: "var(--bg-elev)",
	border: "1px solid var(--border)",
	borderRadius: 9,
	color: "var(--text)",
	padding: "10px 12px",
	fontSize: 14,
	outline: "none",
};

const primaryBtn: React.CSSProperties = {
	background: "var(--primary)",
	color: "#04141f",
	border: "none",
	borderRadius: 9,
	padding: "10px",
	fontWeight: 700,
	cursor: "pointer",
};

const ghostBtn: React.CSSProperties = {
	background: "var(--bg-elev)",
	border: "1px solid var(--border)",
	borderRadius: 9,
	padding: "9px",
	color: "var(--muted)",
	cursor: "pointer",
};
