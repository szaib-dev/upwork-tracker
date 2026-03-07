export type ShareVisibility = "public" | "private";

export type AnalyticsShare = {
	id: string;
	token: string;
	title: string;
	visibility: ShareVisibility;
	isActive: boolean;
	createdAt: string;
	allowedEmails: string[];
};

export type ShareAccessInfo = {
	shareExists: boolean;
	visibility: ShareVisibility | null;
	title: string | null;
	canAccess: boolean;
};
