"use client";
import { createContext, useContext, useMemo, useState } from "react";

type ToastTone = "info" | "success" | "error";
type ToastItem = {
	id: number;
	message: string;
	tone: ToastTone;
};

type ToastContextValue = {
	toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue>({
	toast: () => undefined,
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);

	const value = useMemo(
		() => ({
			toast: (message: string, tone: ToastTone = "info") => {
				const id = Date.now() + Math.floor(Math.random() * 1000);
				setToasts((curr) => [...curr, { id, message, tone }]);
				window.setTimeout(() => {
					setToasts((curr) => curr.filter((item) => item.id !== id));
				}, 2800);
			},
		}),
		[],
	);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div
				style={{
					position: "fixed",
					right: 14,
					bottom: 14,
					zIndex: 220,
					display: "grid",
					gap: 8,
				}}
			>
				{toasts.map((item) => (
					<div
						key={item.id}
						style={{
							minWidth: 220,
							maxWidth: 340,
							background: "var(--bg-soft)",
							border: `1px solid ${item.tone === "error" ? "var(--danger)" : item.tone === "success" ? "var(--success)" : "var(--border)"}`,
							color: item.tone === "error" ? "var(--danger)" : "var(--text)",
							borderRadius: 10,
							padding: "10px 12px",
							boxShadow: "0 10px 28px rgba(0,0,0,0.24)",
							fontSize: 13,
						}}
					>
						{item.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	return useContext(ToastContext);
}
