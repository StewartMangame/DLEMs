"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";

interface Institution {
  id: number;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "", nationalId: "", employeeNumber: "", phone: "", email: "",
    bank: "", password: "", confirmPassword: "",
  });
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    fetch("/api/eligibility/institutions")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setInstitutions(data); })
      .catch(err => console.error("Could not load banks:", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match. Please re-enter both passwords.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        // NestJS error shape: { message: string | string[], error: string, statusCode: number }
        const msg: string = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || data.error || "Registration failed. Please try again.";
        setError(msg);
        return;
      }
      router.push("/user/dashboard");
    } catch {
      setError("Network error — could not reach the server. Please check your connection and try again.");
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
        <div className={`card ${styles.card}`}>
          <div className={styles.cardHeader}>
            <h1 className="text-h2">Create Account</h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Join thousands of Malawians managing loans digitally
            </p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <span>✗</span>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">Full Name</label>
                <input id="fullName" name="fullName" required className="form-input"
                  placeholder="e.g. John Banda" value={form.fullName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="nationalId">National ID</label>
                <input id="nationalId" name="nationalId" required className="form-input"
                  placeholder="MW-XXXXXXXXXX" value={form.nationalId} onChange={handleChange} />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="employeeNumber">Employee / Member ID</label>
                <input id="employeeNumber" name="employeeNumber" required className="form-input"
                  placeholder="e.g. CS-2024-XXXX" value={form.employeeNumber} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <input id="phone" name="phone" required className="form-input"
                  placeholder="+265 XXXXXXXX" value={form.phone} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input id="email" name="email" type="email" required className="form-input"
                autoComplete="email"
                placeholder="yourname@example.com" value={form.email} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bank">
                Your Primary Bank <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span>
              </label>
              <select id="bank" name="bank" className="form-select" value={form.bank} onChange={handleChange}>
                <option value="">— Unbanked / Other —</option>
                {institutions.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
              <div className="form-help">You can update this later in your financial profile.</div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div style={{ position: "relative" }}>
                  <input id="password" name="password" type={showPw ? "text" : "password"}
                    required className="form-input" autoComplete="new-password"
                    placeholder="Min. 8 characters" value={form.password} onChange={handleChange}
                    style={{ paddingRight: "3rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    style={{
                      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--color-text-muted)", fontSize: "1rem", padding: 4,
                    }}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <input id="confirmPassword" name="confirmPassword"
                  type={showPw ? "text" : "password"} required className="form-input"
                  autoComplete="new-password"
                  placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <div style={{ marginTop: 4, fontSize: "0.8rem", color: "var(--color-danger)" }}>
                    ✗ Passwords do not match
                  </div>
                )}
                {form.confirmPassword && form.password === form.confirmPassword && form.password.length >= 8 && (
                  <div style={{ marginTop: 4, fontSize: "0.8rem", color: "var(--color-success)" }}>
                    ✓ Passwords match
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || (form.confirmPassword.length > 0 && form.password !== form.confirmPassword)}
              style={{ width: "100%", marginTop: 8 }}
            >
              {loading ? <><span className="loading-spinner" /> Creating Account…</> : "Create Account →"}
            </button>
          </form>

          <p className={styles.switchLink}>
            Already have an account?{" "}
            <Link href="/user/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
