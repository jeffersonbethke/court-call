"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !confirmPassword || !displayName.trim() || loading) return;

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    // If the only error is a failed confirmation email, the account was still
    // created — sign in directly to get a session and proceed normally.
    const emailSendFailed =
      signUpError?.message?.toLowerCase().includes("error sending confirmation email") ||
      signUpError?.message?.toLowerCase().includes("sending confirmation email");

    if (signUpError && !emailSendFailed) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    let userId = data?.user?.id;

    if (emailSendFailed || !userId) {
      // Account exists but no session — sign in to establish one
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError || !signInData.user) {
        setLoading(false);
        setError("Account created. Please sign in.");
        router.push("/login");
        return;
      }
      userId = signInData.user.id;
    }

    if (!userId) {
      setLoading(false);
      setError("Something went wrong. Try again.");
      return;
    }

    // Create profile with display name
    await supabase
      .from("profiles")
      .upsert({ id: userId, name: displayName.trim() }, { onConflict: "id" });

    router.push("/");
  };

  const canSubmit = email.trim() && password && confirmPassword && displayName.trim() && !loading;

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
          Create account
        </h1>
        <p
          style={{
            fontSize: 17,
            color: "var(--text-secondary)",
            margin: "0 0 40px",
            lineHeight: 1.4,
          }}
        >
          Join Leipers Fork Pickleball Club.
        </p>

        <form onSubmit={handleSignup}>
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
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoFocus
            required
            maxLength={20}
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
            Email address
          </label>
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            Confirm password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            disabled={!canSubmit}
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
              opacity: canSubmit ? 1 : 0.3,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 15, color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--text)", fontWeight: 600, textDecoration: "none" }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
