"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Check if user already has a name → redirect
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      if (data?.name) {
        router.push("/");
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .upsert({ id: user.id, name: name.trim() }, { onConflict: "id" });

    router.push("/");
  };

  return (
    <div
      style={{
        maxWidth: 430,
        margin: "0 auto",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 32px",
      }}
    >
      <div className="animate-in">
        <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
        <h1
          style={{
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: "-0.5px",
            margin: "0 0 8px",
          }}
        >
          Welcome in
        </h1>
        <p
          style={{
            fontSize: 17,
            color: "var(--text-secondary)",
            margin: "0 0 40px",
            lineHeight: 1.4,
          }}
        >
          What should we call you on
          <br />
          the leaderboard?
        </p>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "block",
              marginBottom: 8,
            }}
          >
            Display name
          </label>
          <input
            type="text"
            placeholder="e.g. Mike"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={20}
            style={{
              width: "100%",
              padding: 16,
              borderRadius: 14,
              border: "1px solid var(--border)",
              fontSize: 17,
              outline: "none",
              background: "var(--card)",
            }}
          />
          <button
            type="submit"
            disabled={!name.trim() || loading}
            style={{
              width: "100%",
              marginTop: 16,
              padding: 16,
              borderRadius: 14,
              border: "none",
              background: "#000",
              color: "#FFF",
              fontSize: 17,
              fontWeight: 600,
              cursor: "pointer",
              opacity: name.trim() && !loading ? 1 : 0.3,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Setting up..." : "Let's go"}
          </button>
        </form>
      </div>
    </div>
  );
}
