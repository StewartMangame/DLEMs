"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin-panel/auth/me", { credentials: "include" })
      .then(res => {
        if (res.ok) router.replace("/admin-panel/dashboard");
      })
      .catch(() => {});
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin-panel/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Invalid credentials");
        return;
      }

      router.push("/admin-panel/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <span className={styles.logoIcon}>D</span>
          <div>
            <div className={styles.logoTitle}>DLEM Admin Portal</div>
            <div className={styles.logoSub}>Secure Administrator Access</div>
          </div>
        </div>

        <h1 className={styles.heading}>Sign in to Admin Panel</h1>
        <p className={styles.sub}>
          This area is restricted to authorised administrators only.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="admin-email">Email address</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="admin@dlem.mw"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="Password"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className={styles.footer}>
          Not your portal? <Link href="/">Return to main site</Link>
        </div>
      </div>
    </div>
  );
}
