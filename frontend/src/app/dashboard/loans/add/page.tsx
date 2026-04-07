"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Link from "next/link";

export default function AddLoanPage() {
  const router = useRouter();
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    institutionId: "",
    loanAmount: "",
    monthlyDeduction: "",
    loanTermMonths: "",
    startDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetch("/api/institutions")
      .then((r) => r.json())
      .then((data) => setInstitutions(data.institutions))
      .catch((err) => console.error("Error fetching institutions:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/loans/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          institutionId: parseInt(formData.institutionId),
          loanAmount: parseFloat(formData.loanAmount),
          monthlyDeduction: parseFloat(formData.monthlyDeduction),
          loanTermMonths: parseInt(formData.loanTermMonths),
          startDate: new Date(formData.startDate).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to record loan");
      }

      router.push("/dashboard/loans");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/dashboard/loans" className="btn btn-ghost btn-sm">← Back to Loans</Link>
        <h1 className="text-h2">Record Manual Loan</h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Manually enter details for loans you're already repaying to keep your dashboard accurate.
        </p>
      </div>

      <div className={`card ${styles.formCard}`}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="form-group">
            <label className="form-label">Lending Institution</label>
            <select
              required
              className="form-control"
              value={formData.institutionId}
              onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
            >
              <option value="">Select institution...</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Total Loan Amount (MK)</label>
              <input
                type="number"
                required
                className="form-control"
                placeholder="e.g. 1500000"
                value={formData.loanAmount}
                onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Deduction (MK)</label>
              <input
                type="number"
                required
                className="form-control"
                placeholder="e.g. 45000"
                value={formData.monthlyDeduction}
                onChange={(e) => setFormData({ ...formData, monthlyDeduction: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Loan Term (Months)</label>
              <input
                type="number"
                required
                className="form-control"
                placeholder="e.g. 36"
                value={formData.loanTermMonths}
                onChange={(e) => setFormData({ ...formData, loanTermMonths: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Loan Start Date</label>
              <input
                type="date"
                required
                className="form-control"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Recording..." : "Record Loan Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
