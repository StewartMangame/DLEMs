"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { calculateMonthlyInstallment } from "@/lib/eligibilityEngine";

const PURPOSES = [
  "Home Improvement", "Education", "Medical Expenses",
  "Business Capital", "Vehicle Purchase", "Wedding/Event",
  "Debt Consolidation", "Other",
];

function ApplyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [form, setForm] = useState({
    amount: Number(searchParams.get("amount")) || 500000,
    purpose: "",
    durationMonths: Number(searchParams.get("duration")) || 24,
    institutionId: searchParams.get("institutionId") || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => { if (d.profile) setProfile(d.profile); });
    fetch("/api/institutions").then(r => r.json()).then(d => { if (d.institutions) setInstitutions(d.institutions); });
  }, []);

  const preview = (() => {
    if (form.amount && form.durationMonths) {
      const rateVal = 24; // Standard interest rate for simulation
      const pmt = calculateMonthlyInstallment(form.amount, rateVal, form.durationMonths);
      return { installment: pmt, total: pmt * form.durationMonths, rate: rateVal };
    }
    return null;
  })();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.purpose) { setError("Please select a loan purpose."); return; }
    if (!form.institutionId) { setError("Please select a financial institution."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/loans/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          institutionId: parseInt(form.institutionId as string)
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Submission failed.");
        setLoading(false);
        return;
      }
      router.push("/dashboard/loans");
    } catch (err) {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.grid}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={`card ${styles.formCard}`}>
          <h2 className="text-h3">Loan Details</h2>
          <div className="form-group">
            <label className="form-label" htmlFor="institutionId">Financial Institution</label>
            <select id="institutionId" name="institutionId" required className="form-select"
              value={form.institutionId} onChange={handleChange}>
              <option value="">— Select institution —</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name} ({inst.type})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="amount">Loan Amount (MK)</label>
            <input id="amount" name="amount" type="number" min={50000} step={50000} required
              className="form-input" value={form.amount} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="purpose">Loan Purpose</label>
            <select id="purpose" name="purpose" required className="form-select"
              value={form.purpose} onChange={handleChange}>
              <option value="">— Select purpose —</option>
              {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="durationMonths">Repayment Period</label>
            <select id="durationMonths" name="durationMonths" className="form-select"
              value={form.durationMonths} onChange={handleChange}>
              {[6, 12, 18, 24, 36, 48, 60].map(m => (
                <option key={m} value={m}>{m} months</option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

        {!profile && (
          <div className="alert alert-warning" style={{ marginBottom: 16 }}>
            ⚠ Complete your <Link href="/dashboard/profile">financial profile</Link> before applying.
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg" disabled={!profile || loading}
          style={{ width: "100%" }}>
          {loading ? <><span className="loading-spinner" /> Submitting…</> : "Submit Application →"}
        </button>
      </form>

      {/* Live Preview */}
      <div className={styles.preview}>
        {preview && (
          <>
            <div className={`card ${styles.previewCard}`}>
              <div className="stat-label">Est. Monthly Installment</div>
              <div className="stat-value text-gradient">
                MK {preview.installment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                At {preview.rate}% p.a. (standard rate)
              </div>
            </div>
            <div className={`card ${styles.previewCard}`}>
              <div className="stat-label">Total Repayable</div>
              <div className="stat-value">
                MK {preview.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </>
        )}
        <div className={`card ${styles.noteCard}`}>
          <h3 className="text-h3" style={{ color: "var(--color-info)" }}>ℹ What Happens Next?</h3>
          <ol className={styles.noteList}>
            <li>Your application is submitted for review</li>
            <li>An automated risk score is calculated</li>
            <li>A credit officer reviews and approves/rejects</li>
            <li>You receive a notification of the decision</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className="text-h2">Apply for Loan</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Submit your personal loan application digitally
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading form...</div>}>
        <ApplyForm />
      </Suspense>
    </div>
  );
}
