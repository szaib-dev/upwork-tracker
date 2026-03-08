"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FaLock } from "react-icons/fa";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

function safeNext(next: string | null) {
	if (!next) return "/";
	if (!next.startsWith("/")) return "/";
	if (next.startsWith("//")) return "/";
	return next;
}

export default function SharedSigninPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { session } = useAuth();
	const next = useMemo(() => safeNext(searchParams.get("next")), [searchParams]);

	const [isSignUp, setIsSignUp] = useState(false);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");

	useEffect(() => {
		if (!session) return;
		router.replace(next);
	}, [session, router, next]);

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setNotice("");

		if (isSignUp) {
			const trimmedName = name.trim();
			if (!trimmedName) {
				setLoading(false);
				setError("Name is required.");
				return;
			}
			if (!password || !confirmPassword) {
				setLoading(false);
				setError("Password and confirm password are required.");
				return;
			}
			if (password !== confirmPassword) {
				setLoading(false);
				setError("Passwords do not match.");
				return;
			}
			const { data, error: signupError } = await supabase.auth.signUp({
				email: email.trim(),
				password,
				options: {
					data: { full_name: trimmedName, name: trimmedName },
				},
			});
			setLoading(false);
			if (signupError) {
				setError(signupError.message || "Unable to create account.");
				return;
			}
			if (!data.session) {
				setNotice("Account created. Verify your email, then sign in.");
				setIsSignUp(false);
				setPassword("");
				setConfirmPassword("");
				return;
			}
			router.replace(next);
			return;
		}

		const { error: authError } = await supabase.auth.signInWithPassword({
			email: email.trim(),
			password,
		});
		setLoading(false);
		if (authError) {
			setError(authError.message || "Unable to sign in.");
			return;
		}
		router.replace(next);
	};

	return (
		<>
			<style>{`
				.signin-page {
					min-height: 100vh;
					background: #090d12;
					display: grid;
					place-items: center;
					padding: 16px;
					position: relative;
					overflow: hidden;
					font-family: var(--font-sans), sans-serif;
				}

				.signin-page::before {
					content: '';
					position: absolute;
					top: -200px;
					left: -200px;
					width: 600px;
					height: 600px;
					background: radial-gradient(circle, rgba(var(--primary-rgb, 99,179,237), 0.07) 0%, transparent 65%);
					pointer-events: none;
				}

				.signin-page::after {
					content: '';
					position: absolute;
					bottom: -150px;
					right: -100px;
					width: 500px;
					height: 500px;
					background: radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 65%);
					pointer-events: none;
				}

				.signin-card {
					width: 100%;
					max-width: 400px;
					position: relative;
					z-index: 1;
					animation: cardIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
				}

				@keyframes cardIn {
					from { opacity: 0; transform: translateY(18px); }
					to   { opacity: 1; transform: translateY(0); }
				}

				.signin-inner {
					background: rgba(13, 19, 28, 0.9);
					border: 1px solid rgba(255,255,255,0.08);
					border-radius: 20px;
					padding: 28px 24px 24px;
					backdrop-filter: blur(20px);
					-webkit-backdrop-filter: blur(20px);
					box-shadow:
						0 0 0 1px rgba(255,255,255,0.03),
						0 32px 64px rgba(0,0,0,0.6),
						0 8px 24px rgba(0,0,0,0.4);
				}

				.signin-badge {
					display: inline-flex;
					align-items: center;
					gap: 6px;
					font-family: 'JetBrains Mono', monospace;
					font-size: 10px;
					font-weight: 600;
					color: var(--muted, #6b7a90);
					background: rgba(255,255,255,0.04);
					border: 1px solid rgba(255,255,255,0.08);
					border-radius: 999px;
					padding: 5px 12px;
					margin-bottom: 20px;
					letter-spacing: 0.08em;
					text-transform: uppercase;
				}

				.signin-badge svg {
					opacity: 0.6;
					font-size: 9px;
				}

				.signin-title {
					font-size: clamp(20px, 4vw, 26px);
					font-weight: 800;
					color: var(--text, #e9f1ff);
					margin: 0 0 6px;
					line-height: 1.2;
					letter-spacing: -0.02em;
				}

				.signin-subtitle {
					font-size: 12.5px;
					color: var(--muted, #6b7a90);
					margin: 0 0 24px;
					line-height: 1.5;
				}

				.signin-divider {
					height: 1px;
					background: rgba(255,255,255,0.06);
					margin-bottom: 20px;
				}

				.signin-form {
					display: grid;
					gap: 10px;
				}

				.signin-field {
					display: flex;
					flex-direction: column;
					gap: 5px;
				}

				.signin-label {
					font-size: 10px;
					font-weight: 600;
					color: var(--muted, #6b7a90);
					text-transform: uppercase;
					letter-spacing: 0.08em;
					font-family: 'JetBrains Mono', monospace;
				}

				.signin-input {
					background: rgba(255,255,255,0.04);
					border: 1px solid rgba(255,255,255,0.09);
					border-radius: 10px;
					padding: 11px 13px;
					color: var(--text, #e9f1ff);
					font-size: 13.5px;
					font-family: var(--font-sans), sans-serif;
					outline: none;
					width: 100%;
					box-sizing: border-box;
					transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
				}

				.signin-input::placeholder {
					color: rgba(255,255,255,0.2);
				}

				.signin-input:focus {
					border-color: var(--primary, #63b3ed);
					background: rgba(99,179,237,0.05);
					box-shadow: 0 0 0 3px rgba(99,179,237,0.1);
				}

				.signin-error {
					display: flex;
					align-items: center;
					gap: 7px;
					background: rgba(248, 113, 113, 0.08);
					border: 1px solid rgba(248, 113, 113, 0.2);
					border-radius: 8px;
					padding: 9px 12px;
					color: #f87171;
					font-size: 12px;
					line-height: 1.4;
				}

				.signin-notice {
					display: flex;
					align-items: center;
					gap: 7px;
					background: rgba(139, 231, 166, 0.07);
					border: 1px solid rgba(139, 231, 166, 0.2);
					border-radius: 8px;
					padding: 9px 12px;
					color: #8be7a6;
					font-size: 12px;
					line-height: 1.4;
				}

				.signin-btn {
					background: var(--primary, #63b3ed);
					color: #07111c;
					border: none;
					border-radius: 10px;
					padding: 12px 14px;
					font-weight: 800;
					font-size: 13.5px;
					font-family: var(--font-sans), sans-serif;
					cursor: pointer;
					width: 100%;
					margin-top: 2px;
					letter-spacing: -0.01em;
					transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
					box-shadow: 0 4px 16px rgba(99,179,237,0.25);
				}

				.signin-btn:hover:not(:disabled) {
					opacity: 0.92;
					transform: translateY(-1px);
					box-shadow: 0 6px 20px rgba(99,179,237,0.35);
				}

				.signin-btn:active:not(:disabled) {
					transform: translateY(0);
				}

				.signin-btn:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}

				.signin-footer {
					margin-top: 18px;
					padding-top: 16px;
					border-top: 1px solid rgba(255,255,255,0.06);
					display: flex;
					align-items: center;
					justify-content: space-between;
					flex-wrap: wrap;
					gap: 8px;
				}

				.signin-toggle {
					background: transparent;
					border: none;
					color: var(--primary, #63b3ed);
					cursor: pointer;
					font-size: 12px;
					font-family: 'Sora', sans-serif;
					padding: 0;
					transition: opacity 0.15s;
				}

				.signin-toggle:hover {
					opacity: 0.75;
				}

				.signin-back {
					font-size: 12px;
					color: var(--muted, #6b7a90);
				}

				.signin-back a {
					color: var(--muted, #6b7a90);
					text-decoration: none;
					border-bottom: 1px solid rgba(255,255,255,0.12);
					transition: color 0.15s;
				}

				.signin-back a:hover {
					color: var(--text, #e9f1ff);
				}
			`}</style>

			<div className="signin-page fade-in-up">
				<div className="signin-card">
					<div className="signin-inner">
						<div className="signin-badge">
							<FaLock />
							Shared Access
						</div>

						<h1 className="signin-title">
							{isSignUp ? "Create account" : "Welcome back"}
						</h1>
						<p className="signin-subtitle">
							{isSignUp
								? "Join to participate in shared proposal discussions."
								: "Sign in to access shared proposal discussions."}
						</p>

						<div className="signin-divider" />

						<div className="signin-form">
							{isSignUp && (
								<div className="signin-field">
									<label className="signin-label">Full name</label>
									<input
										type="text"
										required
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="John Doe"
										className="signin-input"
									/>
								</div>
							)}

							<div className="signin-field">
								<label className="signin-label">Email</label>
								<input
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@example.com"
									className="signin-input"
								/>
							</div>

							<div className="signin-field">
								<label className="signin-label">Password</label>
								<input
									type="password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									className="signin-input"
								/>
							</div>

							{isSignUp && (
								<div className="signin-field">
									<label className="signin-label">Confirm password</label>
									<input
										type="password"
										required
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder="••••••••"
										className="signin-input"
									/>
								</div>
							)}

							{error && <div className="signin-error">{error}</div>}
							{notice && <div className="signin-notice">{notice}</div>}

							<button
								onClick={onSubmit}
								disabled={loading}
								className="signin-btn"
							>
								{loading
									? isSignUp ? "Creating account..." : "Signing in..."
									: isSignUp ? "Create account" : "Sign in"}
							</button>
						</div>

						<div className="signin-footer">
							<button
								type="button"
								onClick={() => {
									setIsSignUp((v) => !v);
									setError("");
									setNotice("");
									setPassword("");
									setConfirmPassword("");
								}}
								className="signin-toggle"
							>
								{isSignUp ? "Already have an account? Sign in" : "No account? Create one"}
							</button>

							<span className="signin-back">
								<Link href="/">Back to app</Link>
							</span>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
