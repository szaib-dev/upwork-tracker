"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { emptyProposalInput, Proposal, ProposalInput } from "@/lib/types/proposal";

type NamingStyle = "snake" | "camel";

type HookResult = {
  proposals: Proposal[];
  loading: boolean;
  addProposal: (input: Partial<ProposalInput>) => Promise<{ ok: boolean; error?: string }>;
  updateProposal: (id: number, field: keyof Proposal, value: unknown) => Promise<void>;
  deleteProposal: (id: number) => Promise<{ ok: boolean; error?: string }>;
};

const SOCIAL_KEYS = ["linkedin", "twitter", "upwork", "website"];

function detectNamingStyle(row: Record<string, unknown> | undefined): NamingStyle {
  if (!row) return "snake";
  return "date_sent" in row || "job_title" in row ? "snake" : "camel";
}

function normalizeSocials(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const normalized: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string") normalized[key] = obj[key] as string;
  }
  for (const key of SOCIAL_KEYS) {
    if (!(key in normalized)) normalized[key] = "";
  }
  return normalized;
}

function normalizeRow(row: Record<string, unknown>, naming: NamingStyle): Proposal {
  const isSnake = naming === "snake";
  const get = (camel: string, snake: string) => (isSnake ? row[snake] : row[camel]);

  return {
    id: Number(row.id ?? 0),
    userId: (get("userId", "user_id") as string | null | undefined) ?? null,
    dateSent: String(get("dateSent", "date_sent") ?? ""),
    jobTitle: String(get("jobTitle", "job_title") ?? ""),
    jobUrl: String(get("jobUrl", "job_url") ?? ""),
    budget: Number(get("budget", "budget") ?? 0),
    connects: Number(get("connects", "connects") ?? 0),
    boosted: Boolean(get("boosted", "boosted")),
    loom: Boolean(get("loom", "loom")),
    viewed: Boolean(get("viewed", "viewed")),
    lead: Boolean(get("lead", "lead")),
    status: String(get("status", "status") ?? "Sent") as Proposal["status"],
    replyDate: String(get("replyDate", "reply_date") ?? ""),
    followUpAt: String(get("followUpAt", "follow_up_at") ?? ""),
    followUpTopic: String(get("followUpTopic", "follow_up_topic") ?? ""),
    clientCountry: String(get("clientCountry", "client_country") ?? ""),
    clientName: String(get("clientName", "client_name") ?? ""),
    clientEmail: String(get("clientEmail", "client_email") ?? ""),
    proposalText: String(get("proposalText", "proposal_text") ?? ""),
    socials: normalizeSocials(get("socials", "socials")),
    createdAt: (get("createdAt", "created_at") as string | undefined) ?? undefined,
  };
}

function toDbColumn(field: keyof Proposal, naming: NamingStyle): string {
  if (naming === "camel") return field;

  const map: Partial<Record<keyof Proposal, string>> = {
    userId: "user_id",
    dateSent: "date_sent",
    jobTitle: "job_title",
    jobUrl: "job_url",
    replyDate: "reply_date",
    followUpAt: "follow_up_at",
    followUpTopic: "follow_up_topic",
    clientCountry: "client_country",
    clientName: "client_name",
    clientEmail: "client_email",
    proposalText: "proposal_text",
    createdAt: "created_at",
  };

  return map[field] ?? field;
}

function cleanOptionalDate(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toDbInsert(input: Partial<ProposalInput>, naming: NamingStyle, userId?: string | null): Record<string, unknown> {
  const source: ProposalInput = { ...emptyProposalInput, ...input };
  const patch: Record<string, unknown> = {
    dateSent: source.dateSent || new Date().toISOString().slice(0, 10),
    jobTitle: source.jobTitle,
    jobUrl: source.jobUrl,
    budget: Number(source.budget) || 0,
    connects: Number(source.connects) || 0,
    boosted: Boolean(source.boosted),
    loom: Boolean(source.loom),
    viewed: Boolean(source.viewed),
    lead: Boolean(source.lead),
    status: source.status,
    replyDate: cleanOptionalDate(source.replyDate),
    followUpAt: cleanOptionalDate(source.followUpAt),
    followUpTopic: source.followUpTopic || "",
    clientCountry: source.clientCountry,
    clientName: source.clientName,
    clientEmail: source.clientEmail,
    proposalText: source.proposalText,
    socials: normalizeSocials(source.socials),
  };

  if (userId) patch.userId = userId;
  if (naming === "camel") return patch;

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    output[toDbColumn(key as keyof Proposal, naming)] = value;
  }
  return output;
}

function normalizeUpdate(field: keyof Proposal, value: unknown): unknown {
  if ((field === "followUpAt" || field === "replyDate") && typeof value === "string") {
    const cleaned = value.trim();
    return cleaned || null;
  }
  return value;
}

export function useProposals(userId?: string | null): HookResult {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const namingStyleRef = useRef<NamingStyle>("snake");
  const supportsUserScopeRef = useRef(true);

  const fetchProposals = useCallback(async () => {
    if (!userId) {
      setProposals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const baseQuery = () => supabase.from("proposals").select("*").order("id", { ascending: false });

    let data: Record<string, unknown>[] | null = null;
    let fetchError: string | null = null;

    const scopedResult = await baseQuery().eq("user_id", userId);
    if (!scopedResult.error) {
      data = scopedResult.data as Record<string, unknown>[];
      supportsUserScopeRef.current = true;
    } else if (scopedResult.error.message.includes("user_id")) {
      const fallback = await baseQuery();
      if (!fallback.error) {
        data = fallback.data as Record<string, unknown>[];
        supportsUserScopeRef.current = false;
      } else {
        fetchError = fallback.error.message;
      }
    } else {
      fetchError = scopedResult.error.message;
    }

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError);
      setLoading(false);
      return;
    }

    const style = detectNamingStyle(data?.[0]);
    namingStyleRef.current = style;
    setProposals((data ?? []).map((row) => normalizeRow(row, style)));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void fetchProposals();
    });

    if (!userId) return () => window.cancelAnimationFrame(frame);

    const channel = supabase
      .channel(`proposal-changes-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "proposals" }, (payload) => {
        const row = (payload.new || payload.old) as Record<string, unknown> | null;
        if (!row) return;

        const style = namingStyleRef.current;
        if (supportsUserScopeRef.current) {
          const rowUserId = style === "snake" ? row.user_id : row.userId;
          if (rowUserId !== userId) return;
        }

        const normalized = normalizeRow(row, style);

        if (payload.eventType === "DELETE") {
          setProposals((curr) => curr.filter((item) => item.id !== normalized.id));
          return;
        }

        if (payload.eventType === "INSERT") {
          setProposals((curr) => (curr.some((item) => item.id === normalized.id) ? curr : [normalized, ...curr]));
          return;
        }

        setProposals((curr) => curr.map((item) => (item.id === normalized.id ? { ...item, ...normalized } : item)));
      })
      .subscribe();

    return () => {
      window.cancelAnimationFrame(frame);
      void supabase.removeChannel(channel);
    };
  }, [fetchProposals, userId]);

  const updateProposal = useCallback(
    async (id: number, field: keyof Proposal, value: unknown) => {
      const nextValue = normalizeUpdate(field, value);
      setProposals((curr) => curr.map((item) => (item.id === id ? { ...item, [field]: nextValue as never } : item)));

      const dbField = toDbColumn(field, namingStyleRef.current);
      const patch = { [dbField]: nextValue };

      let query = supabase.from("proposals").update(patch).eq("id", id);
      if (supportsUserScopeRef.current && userId) query = query.eq("user_id", userId);

      const { error } = await query;
      if (error) {
        console.error("Supabase update error:", error.message);
        await fetchProposals();
      }
    },
    [fetchProposals, userId],
  );

  const deleteProposal = useCallback(
    async (id: number) => {
      const current = proposals;
      setProposals((curr) => curr.filter((item) => item.id !== id));

      let query = supabase.from("proposals").delete().eq("id", id);
      if (supportsUserScopeRef.current && userId) query = query.eq("user_id", userId);

      const { error } = await query;
      if (error) {
        setProposals(current);
        return { ok: false, error: error.message };
      }

      return { ok: true };
    },
    [proposals, userId],
  );

  const addProposal = useCallback(
    async (input: Partial<ProposalInput>) => {
      const payload = toDbInsert(input, namingStyleRef.current, userId);
      const { data, error } = await supabase.from("proposals").insert([payload]).select().single();

      if (error) {
        console.error("Supabase insert error:", error.message);
        return { ok: false, error: error.message };
      }

      if (data) {
        const normalized = normalizeRow(data as Record<string, unknown>, namingStyleRef.current);
        setProposals((curr) => [normalized, ...curr]);
      }

      return { ok: true };
    },
    [userId],
  );

  return { proposals, loading, addProposal, updateProposal, deleteProposal };
}
