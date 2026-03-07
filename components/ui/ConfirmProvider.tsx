"use client";
import { createContext, useContext, useMemo, useState } from "react";

type ConfirmContextValue = {
	confirm: (message: string, title?: string) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue>({
	confirm: async () => false,
});

type ConfirmState = {
	open: boolean;
	title: string;
	message: string;
	resolver: ((value: boolean) => void) | null;
};

const initialState: ConfirmState = {
	open: false,
	title: "",
	message: "",
	resolver: null,
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<ConfirmState>(initialState);

	const value = useMemo(
		() => ({
			confirm: (message: string, title = "Confirm action") =>
				new Promise<boolean>((resolve) => {
					setState({
						open: true,
						title,
						message,
						resolver: resolve,
					});
				}),
		}),
		[],
	);

	const closeWith = (valueToResolve: boolean) => {
		if (state.resolver) state.resolver(valueToResolve);
		setState(initialState);
	};

	return (
		<ConfirmContext.Provider value={value}>
			{children}
			{state.open && (
				<div
					style={{
						position: "fixed",
						inset: 0,
						background: "#0000007a",
						zIndex: 230,
						display: "grid",
						placeItems: "center",
						padding: 14,
					}}
				>
					<div
						style={{
							width: "100%",
							maxWidth: 460,
							background: "var(--bg-soft)",
							border: "1px solid var(--border)",
							borderRadius: 12,
							padding: 14,
						}}
					>
						<div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>
							{state.title}
						</div>
						<div
							style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}
						>
							{state.message}
						</div>
						<div
							style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
						>
							<button onClick={() => closeWith(false)} style={ghostBtn}>
								Cancel
							</button>
							<button onClick={() => closeWith(true)} style={dangerBtn}>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</ConfirmContext.Provider>
	);
}

export function useConfirm() {
	return useContext(ConfirmContext);
}

const ghostBtn: React.CSSProperties = {
	background: "var(--bg-elev)",
	border: "1px solid var(--border)",
	color: "var(--text)",
	borderRadius: 8,
	padding: "8px 12px",
	cursor: "pointer",
};

const dangerBtn: React.CSSProperties = {
	background: "color-mix(in srgb, var(--danger) 20%, var(--bg-elev))",
	border: "1px solid var(--danger)",
	color: "var(--danger)",
	borderRadius: 8,
	padding: "8px 12px",
	cursor: "pointer",
	fontWeight: 700,
};
