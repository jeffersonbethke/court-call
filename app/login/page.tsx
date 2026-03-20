"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || loading) return;

    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      setError("Invalid email or password.");
      return;
    }

    // Check if profile exists with a name
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", data.user.id)
        .single();

      if (!profile?.name) {
        router.push("/onboarding");
        return;
      }
    }

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
              marginBottom: 16,
            }}
          />
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
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            disabled={!email.trim() || !password || loading}
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
              opacity: email.trim() && password && !loading ? 1 : 0.3,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 15, color: "var(--text-secondary)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--text)", fontWeight: 600, textDecoration: "none" }}>
            Sign Up
          </Link>
        </p>

        <p style={{ textAlign: "center", marginTop: 12, fontSize: 15 }}>
          <button
            onClick={() => setShowForgot((v) => !v)}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 15, cursor: "pointer", padding: 0 }}
          >
            Forgot password?
          </button>
        </p>

        {showForgot && (
          <div
            style={{
              marginTop: 16,
              padding: 20,
              borderRadius: 14,
              border: "1px solid var(--border)",
              background: "var(--card)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 15, lineHeight: 1.5, margin: "0 0 16px", color: "var(--text-secondary)" }}>
              Just create a new account with your email and a new password. Your old scores will still be there.
            </p>
            <Link
              href="/signup"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                borderRadius: 12,
                background: "#000",
                color: "#FFF",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Go to Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
