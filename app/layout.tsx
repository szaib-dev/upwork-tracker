import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
	subsets: ["latin"],
	variable: "--font-sans",
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
	display: "swap",
});

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={`${manrope.variable} ${jetbrainsMono.variable}`}>
			<body>
				<ThemeProvider>
					<ToastProvider>
						<ConfirmProvider>
							<AuthProvider>{children}</AuthProvider>
						</ConfirmProvider>
					</ToastProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
