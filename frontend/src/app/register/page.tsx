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

  useEffect(() => {
    fetch("/api/eligibility/institutions")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setInstitutions(data);
      })
      .catch(err => console.error("Could not load banks:", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
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
      if (!res.ok) { setError(data.error || "Registration failed."); return; }
      router.push("/dashboard");
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
        <div className={`card ${styles.card}`}>
          <div className={styles.cardHeader}>
            <h1 className="text-h2">Create Account</h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Join thousands of Malawians managing loans digitally
            </p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">Full Name</label>
                <input id="fullName" name="fullName" required className="form-input"
                  placeholder="John Banda" value={form.fullName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="nationalId">National ID</label>
                <input id="nationalId" name="nationalId" required className="form-input"
                  placeholder="MW-XXXXXXXXXX" value={form.nationalId} onChange={handleChange} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="employeeNumber">Employee / Member ID Number</label>
                <input id="employeeNumber" name="employeeNumber" required className="form-input"
                  placeholder="CS-2024-XXXX" value={form.employeeNumber} onChange={handleChange} />
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
                placeholder="Stewart@example.com" value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="bank">Your Bank</label>
              <select id="bank" name="bank" required className="form-select" value={form.bank} onChange={handleChange}>
                <option value="">— Select your bank —</option>
                {institutions.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <input id="password" name="password" type="password" required className="form-input"
                  placeholder="Min. 8 characters" value={form.password} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <input id="confirmPassword" name="confirmPassword" type="password" required className="form-input"
                  placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", marginTop: 4 }}>
              {loading ? <><span className="loading-spinner" /> Creating Account…</> : "Create Account →"}
            </button>
          </form>

          <p className={styles.switchLink}>
            Already have an account?{" "}
            <Link href="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
