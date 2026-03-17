"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

// ─── Types ────────────────────────────────────────────────────────
type Profile = { id: string; name: string };
type Score = {
  id: string;
  user_id: string;
  points: number;
  result: "win" | "loss";
  played_date: string;
  created_at: string;
};
type PlayerStats = Profile & {
  wins: number;
  losses: number;
  points: number;
  games: number;
  winPct: number;
};

// ─── Helpers ──────────────────────────────────────────────────────
function getToday() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function calcStats(scores: Score[]) {
  const wins = scores.filter((s) => s.result === "win").length;
  const losses = scores.filter((s) => s.result === "loss").length;
  const points = scores.reduce((sum, s) => sum + s.points, 0);
  const games = scores.length;
  return { wins, losses, points, games, winPct: games > 0 ? wins / games : 0 };
}

// ─── Icons ────────────────────────────────────────────────────────
const Icon = {
  Home: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Plus: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  Trophy: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
  ),
  User: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Check: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

// ─── Main Page ────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<"home" | "add" | "leaderboard" | "me">("home");
  const [allScores, setAllScores] = useState<Score[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // ─── Score form state ──────────────────────────
  const [formPoints, setFormPoints] = useState("");
  const [formResult, setFormResult] = useState<"win" | "loss" | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  // ─── Leaderboard view ──────────────────────────
  const [boardView, setBoardView] = useState<"today" | "season">("today");

  // ─── Delete confirm ────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ─── Load data ─────────────────────────────────
  const loadData = useCallback(async () => {
    const [{ data: profiles }, { data: scores }] = await Promise.all([
      supabase.from("profiles").select("id, name").neq("name", ""),
      supabase.from("scores").select("*").order("created_at", { ascending: false }),
    ]);
    setAllProfiles(profiles || []);
    setAllScores(scores || []);
  }, []);

  // Init
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("id", user.id)
        .single();
      if (!prof || !prof.name) {
        router.push("/onboarding");
        return;
      }
      setProfile(prof);
      await loadData();
      setLoading(false);
    })();
  }, []);

  // Refresh on tab change
  useEffect(() => {
    if (!loading && (tab === "home" || tab === "leaderboard")) {
      loadData();
    }
  }, [tab]);

  // ─── Realtime subscription ─────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("scores-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scores" },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ─── Computed ──────────────────────────────────
  const myScores = profile
    ? allScores.filter((s) => s.user_id === profile.id)
    : [];

  function buildLeaderboard(dateFilter?: string): PlayerStats[] {
    return allProfiles
      .map((p) => {
        let scores = allScores.filter((s) => s.user_id === p.id);
        if (dateFilter) scores = scores.filter((s) => s.played_date === dateFilter);
        const stats = calcStats(scores);
        return { ...p, ...stats };
      })
      .filter((p) => p.games > 0)
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.points !== a.points) return b.points - a.points;
        return b.winPct - a.winPct;
      });
  }

  const todayBoard = buildLeaderboard(getToday());
  const seasonBoard = buildLeaderboard();
  const todayStats = calcStats(myScores.filter((s) => s.played_date === getToday()));
  const seasonStats = calcStats(myScores);
  const myTodayRank = profile
    ? todayBoard.findIndex((p) => p.id === profile.id) + 1
    : 0;
  const mySeasonRank = profile
    ? seasonBoard.findIndex((p) => p.id === profile.id) + 1
    : 0;
  const currentBoard = boardView === "today" ? todayBoard : seasonBoard;

  // ─── Actions ───────────────────────────────────
  const handleSaveScore = async () => {
    if (!profile || formPoints === "" || !formResult || formSaving) return;
    setFormSaving(true);

    await supabase.from("scores").insert({
      user_id: profile.id,
      points: parseInt(formPoints),
      result: formResult,
      played_date: getToday(),
    });

    await loadData();
    setFormPoints("");
    setFormResult(null);
    setFormSaving(false);
    setToast("Score saved!");
    setTimeout(() => setToast(null), 2000);
  };

  const handleDeleteScore = async (id: string) => {
    await supabase.from("scores").delete().eq("id", id);
    await loadData();
    setConfirmDelete(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ─── Loading state ─────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          maxWidth: 430,
          margin: "0 auto",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🏓</p>
          <p style={{ fontSize: 17, color: "var(--text-secondary)", fontWeight: 500 }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  const canSave = formPoints !== "" && parseInt(formPoints) >= 0 && formResult !== null;

  // ─── Render ────────────────────────────────────
  return (
    <div
      style={{
        maxWidth: 430,
        margin: "0 auto",
        minHeight: "100vh",
        position: "relative",
        paddingBottom: 90,
        background: "var(--bg)",
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 60,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#000",
            color: "#FFF",
            padding: "14px 24px",
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 600,
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            animation: "fadeInDown 0.3s ease",
          }}
        >
          <Icon.Check />
          {toast}
        </div>
      )}

      {/* ═══════ HOME TAB ═══════ */}
      {tab === "home" && profile && (
        <>
          <div style={{ padding: "52px 24px 12px", position: "sticky", top: 0, background: "var(--bg)", zIndex: 10 }}>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: "0 0 4px" }}>Welcome back</p>
            <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.5px", margin: 0 }}>{profile.name}</h1>
          </div>
          <div style={{ padding: "0 24px 24px" }} className="animate-in">
            <button
              onClick={() => setTab("add")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                width: "100%",
                padding: 18,
                borderRadius: 14,
                border: "none",
                background: "#000",
                color: "#FFF",
                fontSize: 18,
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 20,
              }}
            >
              <Icon.Plus /> Add Score
            </button>

            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>Today</p>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              {[
                { v: todayStats.wins, l: "Wins" },
                { v: todayStats.losses, l: "Losses" },
                { v: todayStats.points, l: "Points" },
                { v: myTodayRank || "–", l: "Rank" },
              ].map((s) => (
                <div key={s.l} style={{ flex: 1, background: "var(--card)", borderRadius: 16, padding: 16, textAlign: "center", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", margin: 0, lineHeight: 1.2 }}>{s.v}</p>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.3px" }}>{s.l}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>Season</p>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              {[
                { v: seasonStats.wins, l: "Wins" },
                { v: seasonStats.losses, l: "Losses" },
                { v: seasonStats.points, l: "Points" },
                { v: mySeasonRank || "–", l: "Rank" },
              ].map((s) => (
                <div key={s.l} style={{ flex: 1, background: "var(--card)", borderRadius: 16, padding: 16, textAlign: "center", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", margin: 0, lineHeight: 1.2 }}>{s.v}</p>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.3px" }}>{s.l}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setTab("leaderboard")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                width: "100%",
                padding: 16,
                borderRadius: 14,
                border: "none",
                background: "var(--border-light)",
                fontSize: 17,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Icon.Trophy /> View Leaderboard
            </button>
          </div>
        </>
      )}

      {/* ═══════ ADD SCORE TAB ═══════ */}
      {tab === "add" && (
        <>
          <div style={{ padding: "52px 24px 12px" }}>
            <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.5px", margin: 0 }}>Add Score</h1>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: "4px 0 0" }}>Log your game result</p>
          </div>
          <div style={{ padding: "0 24px 24px" }} className="animate-in">
            <div style={{ background: "var(--card)", borderRadius: 16, padding: 20, marginBottom: 12, border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>Points scored</p>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={formPoints}
                onChange={(e) => setFormPoints(e.target.value)}
                min="0"
                max="99"
                style={{
                  width: "100%",
                  padding: 20,
                  borderRadius: 14,
                  border: "2px solid var(--border)",
                  fontSize: 44,
                  fontWeight: 700,
                  textAlign: "center",
                  letterSpacing: "-1px",
                  outline: "none",
                  background: "var(--card)",
                }}
              />
            </div>

            <div style={{ background: "var(--card)", borderRadius: 16, padding: 20, marginBottom: 20, border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>Result</p>
              <div style={{ display: "flex", gap: 12 }}>
                {(["win", "loss"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setFormResult(r)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 20,
                      borderRadius: 14,
                      border: formResult === r ? "2px solid #000" : "2px solid transparent",
                      background: formResult === r ? "#000" : "var(--border-light)",
                      color: formResult === r ? "#FFF" : "#000",
                      fontSize: 18,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {r === "win" ? "Win" : "Loss"}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveScore}
              disabled={!canSave || formSaving}
              style={{
                width: "100%",
                padding: 18,
                borderRadius: 14,
                border: "none",
                background: "#000",
                color: "#FFF",
                fontSize: 18,
                fontWeight: 600,
                cursor: "pointer",
                opacity: canSave ? 1 : 0.3,
              }}
            >
              {formSaving ? "Saving..." : "Save Score"}
            </button>
          </div>
        </>
      )}

      {/* ═══════ LEADERBOARD TAB ═══════ */}
      {tab === "leaderboard" && (
        <>
          <div style={{ padding: "52px 24px 12px" }}>
            <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.5px", margin: 0 }}>Leaderboard</h1>
          </div>
          <div style={{ padding: "0 24px 24px" }} className="animate-in">
            {/* Segmented control */}
            <div style={{ display: "flex", background: "var(--border-light)", borderRadius: 10, padding: 2, marginBottom: 16 }}>
              {(["today", "season"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setBoardView(v)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 8,
                    border: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: boardView === v ? "var(--card)" : "transparent",
                    color: boardView === v ? "var(--text)" : "var(--text-secondary)",
                    boxShadow: boardView === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {v === "today" ? "Today" : "Season"}
                </button>
              ))}
            </div>

            {currentBoard.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
                <p style={{ fontSize: 40, margin: "0 0 12px" }}>🏓</p>
                <p style={{ fontSize: 17, fontWeight: 500 }}>
                  {boardView === "today" ? "No games today yet" : "No games recorded yet"}
                </p>
                <p style={{ fontSize: 15, marginTop: 4 }}>Add a score to get started</p>
              </div>
            ) : (
              <div style={{ background: "var(--card)", borderRadius: 16, padding: 20, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", padding: "0 0 10px", borderBottom: "1px solid var(--border-light)" }}>
                  <span style={{ width: 32, fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.3px" }}>#</span>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.3px" }}>Player</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.3px", textAlign: "right", minWidth: 60 }}>W-L</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.3px", textAlign: "right", minWidth: 44 }}>PTS</span>
                </div>
                {currentBoard.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "14px 0",
                      borderBottom: i < currentBoard.length - 1 ? "1px solid var(--border-light)" : "none",
                    }}
                  >
                    <span style={{ width: 32, fontSize: i < 3 ? 20 : 17, fontWeight: 700, color: i >= 3 ? "var(--text-secondary)" : undefined, flexShrink: 0 }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 17, fontWeight: i < 3 ? 700 : 500 }}>{p.name}</span>
                    <span style={{ fontSize: 15, color: "var(--text-secondary)", textAlign: "right", minWidth: 60 }}>{p.wins}-{p.losses}</span>
                    <span style={{ fontSize: 22, fontWeight: 700, textAlign: "right", minWidth: 44 }}>{p.points}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════ ME TAB ═══════ */}
      {tab === "me" && profile && (
        <>
          <div style={{ padding: "52px 24px 12px" }}>
            <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.5px", margin: 0 }}>Me</h1>
          </div>
          <div style={{ padding: "0 24px 24px" }} className="animate-in">
            {/* Profile card */}
            <div style={{ background: "var(--card)", borderRadius: 16, padding: 20, marginBottom: 12, border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    background: "#000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFF",
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{profile.name}</p>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "2px 0 0" }}>
                    {seasonStats.games} games played
                  </p>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              {[
                { v: seasonStats.wins, l: "Wins" },
                { v: seasonStats.losses, l: "Losses" },
                { v: seasonStats.games > 0 ? Math.round(seasonStats.winPct * 100) + "%" : "0%", l: "Win %" },
              ].map((s) => (
                <div key={s.l} style={{ flex: 1, background: "var(--card)", borderRadius: 16, padding: 16, textAlign: "center", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", margin: 0, lineHeight: 1.2 }}>{s.v}</p>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.3px" }}>{s.l}</p>
                </div>
              ))}
            </div>

            {/* Recent games */}
            {myScores.length > 0 && (
              <>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "20px 0 8px" }}>Recent games</p>
                <div style={{ background: "var(--card)", borderRadius: 16, padding: "4px 20px", border: "1px solid var(--border)" }}>
                  {myScores.slice(0, 20).map((g, i) => (
                    <div
                      key={g.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 0",
                        borderBottom: i < Math.min(myScores.length, 20) - 1 ? "1px solid var(--border-light)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            background: g.result === "win" ? "var(--green)" : "var(--red)",
                            color: g.result === "win" ? "var(--green-text)" : "var(--red-text)",
                          }}
                        >
                          {g.result === "win" ? "W" : "L"}
                        </span>
                        <span style={{ marginLeft: 12, fontSize: 17, fontWeight: 600 }}>{g.points} pts</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                          {formatDate(g.played_date)} · {formatTime(g.created_at)}
                        </span>
                        {confirmDelete === g.id ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => handleDeleteScore(g.id)}
                              style={{ background: "#FF3B30", color: "#FFF", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              style={{ background: "var(--border-light)", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(g.id)}
                            style={{ background: "none", border: "none", fontSize: 13, color: "var(--text-tertiary)", cursor: "pointer", padding: 6 }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ height: 20 }} />
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: 16,
                borderRadius: 14,
                border: "none",
                background: "var(--border-light)",
                color: "#FF3B30",
                fontSize: 17,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </div>
        </>
      )}

      {/* ═══════ TAB BAR ═══════ */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 430,
          display: "flex",
          justifyContent: "space-around",
          background: "rgba(250,250,250,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid #E5E5EA",
          padding: "8px 0 28px",
          zIndex: 100,
        }}
      >
        {(
          [
            { id: "home", label: "Home", I: Icon.Home },
            { id: "add", label: "Add Score", I: Icon.Plus },
            { id: "leaderboard", label: "Board", I: Icon.Trophy },
            { id: "me", label: "Me", I: Icon.User },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              background: "none",
              border: "none",
              padding: "6px 16px",
              cursor: "pointer",
              fontSize: 10,
              fontWeight: 500,
              color: tab === t.id ? "#000" : "var(--text-secondary)",
              letterSpacing: "0.2px",
            }}
          >
            <t.I />
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
