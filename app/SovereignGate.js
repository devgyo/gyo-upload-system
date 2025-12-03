"use client";

import { useEffect, useState } from "react";

const PASSWORD = "192837";
const UNLOCK_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours
const STORAGE_KEY = "gyo_sov_lock_expires_at";

export default function SovereignGate({ children }) {
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEY)
          : null;
      const expiresAt = raw ? Number(raw) : 0;
      const now = Date.now();

      if (expiresAt && expiresAt > now) {
        setUnlocked(true);
      }
    } finally {
      setChecking(false);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() === PASSWORD) {
      const expiresAt = Date.now() + UNLOCK_WINDOW_MS;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(expiresAt));
      } catch (err) {
        console.error("Failed to persist lock state", err);
      }
      setUnlocked(true);
      setError("");
      setInput("");
    } else {
      setError("ACCESS DENIED.");
      setInput("");
    }
  };

  if (checking) {
    return (
      <div className="lock-screen">
        <div className="lock-panel">
          <div className="lock-title">主権統御院・中枢管理システム</div>
          <div className="lock-status">&gt; VERIFYING ACCESS TOKEN...</div>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="lock-screen">
        <div className="lock-panel">
          <div className="lock-title">主権統御院・中枢管理システム</div>
          <div className="lock-subtitle">[ SOVEREIGN ACCESS REQUIRED ]</div>
          <form onSubmit={handleSubmit} className="lock-form">
            <label className="lock-label">
              ACCESS CODE:
              <input
                type="password"
                className="lock-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
              />
            </label>
            <button type="submit" className="lock-button">
              [ UNLOCK 6H ]
            </button>
          </form>
          <div className="lock-hint">
            &gt; AUTH WINDOW: 6H PER SUCCESSFUL ENTRY
          </div>
          {error && <div className="lock-error">&gt; {error}</div>}
        </div>
      </div>
    );
  }

  return children;
}
