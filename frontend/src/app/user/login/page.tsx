"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed."); return; }
      if (data.role === "admin") router.push("/admin");
      else router.push("/user/dashboard");
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
            <h1 className="text-h2">Welcome Back</h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Sign in to access your loan dashboard
            </p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input id="email" name="email" type="email" required className="form-input"
                placeholder="your@email.com" value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required className="form-input"
                placeholder="Your password" value={form.password} onChange={handleChange} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", marginTop: 4 }}>
              {loading ? <><span className="loading-spinner" /> Signing in…</> : "Sign In →"}
            </button>
          </form>

          <div className={styles.adminNote}>
            <Link href="/admin/login" className="badge badge-info" style={{ cursor: "pointer", textDecoration: "none" }}>
              Admin Access
            </Link>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Credit officers: use your admin credentials
            </span>
          </div>

          <p className={styles.switchLink}>
            New customer?{" "}
            <Link href="/user/register">Create an Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
