export type ProposalStatus =
  | "Sent"
  | "Viewed"
  | "Replied"
  | "Interview"
  | "Hired"
  | "Rejected";

export type Proposal = {
  id: number;
  userId?: string | null;
  dateSent: string;
  jobTitle: string;
  jobUrl: string;
  budget: number;
  connects: number;
  boosted: boolean;
  loom: boolean;
  viewed: boolean;
  lead: boolean;
  status: ProposalStatus;
  replyDate: string;
  followUpAt: string;
  followUpTopic: string;
  clientCountry: string;
  clientName: string;
  clientEmail: string;
  proposalText: string;
  socials: Record<string, string>;
  createdAt?: string;
};

export type ProposalInput = Omit<Proposal, "id">;

export const emptyProposalInput: ProposalInput = {
  userId: null,
  dateSent: new Date().toISOString().split("T")[0],
  jobTitle: "",
  jobUrl: "",
  budget: 0,
  connects: 0,
  boosted: false,
  loom: false,
  viewed: false,
  lead: false,
  status: "Sent",
  replyDate: "",
  followUpAt: "",
  followUpTopic: "",
  clientCountry: "",
  clientName: "",
  clientEmail: "",
  proposalText: "",
  socials: {},
  createdAt: undefined,
};
