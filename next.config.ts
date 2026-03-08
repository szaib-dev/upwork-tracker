import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	poweredByHeader: false,
	compress: true,
	experimental: {
		optimizePackageImports: ["react-icons", "recharts", "gsap"],
	},
};

export default nextConfig;
