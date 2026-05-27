"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../auth.module.css";
import { Hexagon, ArrowLeft, KeyRound } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Failed to reset password.");
        return;
      }
      setMessage("Password has been reset successfully. Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="alert alert-danger">
        Invalid or missing reset token. Please request a new password reset link.
      </div>
    );
  }

  return (
    <>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {!message && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="password">New Password</label>
            <input id="password" name="password" type="password" required className="form-input"
              placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" required className="form-input"
              placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", marginTop: 4 }}>
            {loading ? <><span className="loading-spinner" /> Resetting…</> : <><KeyRound size={20} style={{ marginRight: 8 }} /> Reset Password</>}
          </button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.page}>
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />
      <div className={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <Link href="/login" className="btn btn-ghost btn-sm" style={{ gap: '8px' }}>
            <ArrowLeft size={16} /> Back
          </Link>
          <Link href="/" className={styles.logo}>
            <Hexagon size={24} className={styles.logoIcon} /> DLEM
          </Link>
        </div>
        <div className={`card ${styles.card} ${styles.cardNarrow}`}>
          <div className={styles.cardHeader}>
            <h1 className="text-h2">Set New Password</h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Please enter your new password below.
            </p>
          </div>
          <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
          <p className={styles.switchLink}>
            <Link href="/login">Back</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

