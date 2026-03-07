export const STATUSES = [
	"Sent",
	"Viewed",
	"Replied",
	"Interview",
	"Hired",
	"Rejected",
];

export const STATUS_COLORS = {
	Sent: { bg: "#1E2830", text: "#94A3B8", dot: "#94A3B8" },
	Viewed: { bg: "#2A2200", text: "#FFD060", dot: "#FFD060" },
	Replied: { bg: "#1E1030", text: "#B06EFF", dot: "#B06EFF" },
	Interview: { bg: "#002A20", text: "#00E599", dot: "#00E599" },
	Hired: { bg: "#002A20", text: "#00E599", dot: "#00E599" },
	Rejected: { bg: "#2A0010", text: "#FF4D6A", dot: "#FF4D6A" },
};

export const grain = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`;

export const SAMPLE_DATA = [
	{
		id: 1,
		dateSent: "2025-01-05",
		jobTitle: "Next.js SaaS Dashboard",
		budget: 800,
		connects: 6,
		boosted: true,
		loom: true,
		viewed: true,
		status: "Hired",
		clientCountry: "USA",
	},
	// ... rest of your 20 sample items here
];
