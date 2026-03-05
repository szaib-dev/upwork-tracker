"use client";
import { useMemo, useState } from "react";
import { HiOutlineClipboardDocument, HiOutlineGlobeAlt, HiOutlineLockClosed, HiOutlineShare } from "react-icons/hi2";
import { useAnalyticsShares } from "@/hooks/shares";
import { ShareVisibility } from "@/lib/types/share";
import { useToast } from "@/components/ui/ToastProvider";

function splitEmails(raw: string): string[] {
  return raw
    .split(/[\n,;\s]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function HeaderShareButton({ userId }: { userId: string }) {
  const { creating, createShare } = useAnalyticsShares(userId);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Team Dashboard Access");
  const [visibility, setVisibility] = useState<ShareVisibility>("public");
  const [emailsRaw, setEmailsRaw] = useState("");
  const [createdLink, setCreatedLink] = useState("");

  const parsedEmails = useMemo(() => splitEmails(emailsRaw), [emailsRaw]);

  const copyToClipboard = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast("Link copied to clipboard.", "success");
    } catch {
      toast("Copy failed. Link is visible to copy manually.", "error");
    }
  };

  const handleCreate = async () => {
    const result = await createShare({ title, visibility, emails: parsedEmails });
    if (!result.ok) {
      toast(result.error || "Failed to create link.", "error");
      return;
    }
    const link = `${window.location.origin}/shared/${result.token}`;
    setCreatedLink(link);
    await copyToClipboard(link);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Share" title="Share" style={iconBtn}>
        <HiOutlineShare />
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 180, background: "#00000080", display: "grid", placeItems: "center", padding: 14 }}>
          <div style={{ width: "100%", maxWidth: 560, background: "var(--bg-soft)", border: "1px solid var(--border)", borderRadius: 14, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>Share Dashboard</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Create public/private link with instant copy.</div>
              </div>
              <button onClick={() => setOpen(false)} style={ghostBtn}>Close</button>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Link title" style={field} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => setVisibility("public")} style={toggleBtn(visibility === "public")}><HiOutlineGlobeAlt /> Public</button>
                <button onClick={() => setVisibility("private")} style={toggleBtn(visibility === "private")}><HiOutlineLockClosed /> Private</button>
              </div>
              {visibility === "private" && (
                <textarea value={emailsRaw} onChange={(e) => setEmailsRaw(e.target.value)} placeholder="Allowed emails (comma, space, new line)" style={{ ...field, minHeight: 72, resize: "vertical" }} />
              )}
              <button onClick={() => void handleCreate()} disabled={creating} style={createBtn}>
                {creating ? "Creating..." : "Create Link"}
              </button>

              {createdLink && (
                <div style={{ border: "1px solid var(--border)", background: "var(--bg-elev)", borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Created Link</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input readOnly value={createdLink} style={{ ...field, padding: "8px 10px" }} />
                    <button onClick={() => void copyToClipboard(createdLink)} style={ghostBtn} title="Copy">
                      <HiOutlineClipboardDocument />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const iconBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: 9,
  width: 34,
  height: 34,
  cursor: "pointer",
  fontSize: 18,
};

const field: React.CSSProperties = {
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  borderRadius: 9,
  color: "var(--text)",
  padding: "10px 11px",
  fontSize: 13,
  width: "100%",
  outline: "none",
};

function toggleBtn(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: active ? "var(--primary-soft)" : "var(--bg-elev)",
    border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
    color: active ? "var(--primary)" : "var(--text)",
    borderRadius: 9,
    padding: "8px 10px",
    fontSize: 12,
    cursor: "pointer",
  };
}

const createBtn: React.CSSProperties = {
  background: "var(--primary)",
  color: "#11161d",
  border: "1px solid color-mix(in srgb, var(--primary) 70%, var(--border))",
  borderRadius: 9,
  padding: "10px 12px",
  fontWeight: 800,
  cursor: "pointer",
};

const ghostBtn: React.CSSProperties = {
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: 9,
  padding: "8px 10px",
  cursor: "pointer",
};

