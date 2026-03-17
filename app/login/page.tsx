"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError("Something went wrong. Try again.");
    } else {
      setSent(true);
    }
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
        <img src="/logo.png" alt="Leipers Fork Pickleball Club mascot" style={{ width: 90, height: 90, objectFit: "contain", marginBottom: 12 }} />
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.5px",
            margin: "0 0 6px",
            lineHeight: 1.2,
          }}
        >
          Leipers Fork Pickleball Club
        </h1>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Court Call
        </p>
        <p
          style={{
            fontSize: 17,
            color: "var(--text-secondary)",
            margin: "0 0 40px",
            lineHeight: 1.4,
          }}
        >
          Track your pickleball scores.
          <br />
          Compete with your crew.
        </p>

        {sent ? (
          <div
            style={{
              background: "var(--card)",
              borderRadius: 16,
              padding: 24,
              border: "1px solid var(--border)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
            <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Check your email
            </p>
            <p
              style={{
                fontSize: 15,
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              We sent a magic link to{" "}
              <strong style={{ color: "var(--text)" }}>{email}</strong>.
              <br />
              Tap it to sign in.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              style={{
                marginTop: 20,
                background: "var(--border-light)",
                border: "none",
                borderRadius: 12,
                padding: "12px 24px",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Use different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
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
              Email address
            </label>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
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
            {error && (
              <p style={{ color: "var(--red-text)", fontSize: 14, marginTop: 8 }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={!email.trim() || loading}
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
                opacity: email.trim() && !loading ? 1 : 0.3,
                transition: "opacity 0.15s",
              }}
            >
              {loading ? "Sending..." : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
