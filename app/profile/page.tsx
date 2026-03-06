"use client";
import { useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const { session } = useAuth();
  const initialName = useMemo(
    () => String(session?.user?.user_metadata?.full_name ?? session?.user?.user_metadata?.name ?? ""),
    [session?.user?.user_metadata],
  );
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const saveProfile = async () => {
    const nextName = name.trim();
    if (!nextName) {
      setError("Name is required.");
      setMessage("");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: nextName, name: nextName },
    });
    setSaving(false);
    if (updateError) {
      setError(updateError.message || "Unable to update profile.");
      return;
    }
    setMessage("Profile updated.");
  };

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "grid", placeItems: "center" }}>
        Please sign in first.
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <AppHeader />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "16px 12px 28px" }}>
        <section style={{ background: "var(--bg-soft)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Profile</div>
          <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>Manage your account details.</div>

          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Your name" />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input value={session.user.email || ""} disabled style={{ ...inputStyle, opacity: 0.7, cursor: "not-allowed" }} />
            </div>
          </div>

          {error && <div style={{ marginTop: 12, color: "var(--danger)", fontSize: 13 }}>{error}</div>}
          {message && <div style={{ marginTop: 12, color: "var(--success)", fontSize: 13 }}>{message}</div>}

          <div style={{ marginTop: 14 }}>
            <button onClick={() => void saveProfile()} disabled={saving} style={saveBtn}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--text)",
  fontSize: 14,
  padding: "10px 12px",
  boxSizing: "border-box",
  outline: "none",
};

const saveBtn: React.CSSProperties = {
  background: "var(--primary)",
  color: "#02111a",
  border: "1px solid color-mix(in srgb, var(--primary) 60%, var(--border))",
  borderRadius: 10,
  height: 36,
  padding: "0 14px",
  fontWeight: 700,
  cursor: "pointer",
};

