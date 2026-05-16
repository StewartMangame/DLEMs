"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      // DLEM's backend is likely running on port 3001 if frontend is on 3000,
      // but if we are using the Next.js API proxy, we use /api/auth/...
      // Wait, let's look at login page: fetch("/api/auth/login"...)
      // So we will use the same pattern.
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Failed to request password reset.");
        return;
      }
      setMessage(data.message || "Password reset request successful.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span> DLEM
        </Link>
        <div className={`card ${styles.card} ${styles.cardNarrow}`}>
          <div className={styles.cardHeader}>
            <h1 className="text-h2">Forgot Password</h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Enter your email to receive a password reset link.
            </p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          {!message && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input id="email" name="email" type="email" required className="form-input"
                  placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", marginTop: 4 }}>
                {loading ? <><span className="loading-spinner" /> Sending…</> : "Send Reset Link"}
              </button>
            </form>
          )}

          <p className={styles.switchLink}>
            Remembered your password?{" "}
            <Link href="/user/login">Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
