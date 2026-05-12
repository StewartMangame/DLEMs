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
    customProviderName: "",
    loanAmount: "",
    interestRate: "",
    loanTermMonths: "",
    startDate: new Date().toISOString().split("T")[0],
    loanPurpose: "",
  });

  useEffect(() => {
    // Fetch institutions from the new public endpoint
    fetch("/api/eligibility/institutions")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setInstitutions(data);
        else if (data.institutions) setInstitutions(data.institutions);
      })
      .catch((err) => console.error("Error fetching institutions:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload: any = {
        loanAmount: parseFloat(formData.loanAmount),
        interestRate: parseFloat(formData.interestRate || "0"),
        loanTermMonths: parseInt(formData.loanTermMonths),
        startDate: new Date(formData.startDate).toISOString(),
        loanPurpose: formData.loanPurpose,
      };

      if (formData.institutionId === "other" || !formData.institutionId) {
        payload.providerName = formData.customProviderName || "Unknown Lender";
      } else {
        payload.institutionId = parseInt(formData.institutionId);
      }

      const res = await fetch("/api/loans/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        <Link href="/user/dashboard/loans" className="btn btn-ghost btn-sm">← Back to Loans</Link>
        <h1 className="text-h2">Record Manual Loan</h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Manually enter details for loans you're already repaying to keep your dashboard accurate.
        </p>
      </div>

      <div className={`card ${styles.formCard}`}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Lending Institution</label>
              <select
                required
                className="form-select"
                value={formData.institutionId}
                onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
              >
                <option value="">Select institution...</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
                <option value="other">Other / Not Listed</option>
              </select>
            </div>
            
            {formData.institutionId === "other" && (
              <div className="form-group animate-fadeInUp">
                <label className="form-label">Lender Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Village SACCO"
                  value={formData.customProviderName}
                  onChange={(e) => setFormData({ ...formData, customProviderName: e.target.value })}
                />
              </div>
            )}
            
            {formData.institutionId !== "other" && <div className="form-group" />}
          </div>

          <div className="form-group">
            <label className="form-label">Loan Purpose</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Home Renovation, School Fees"
              value={formData.loanPurpose}
              onChange={(e) => setFormData({ ...formData, loanPurpose: e.target.value })}
            />
            <div className="form-help">A short description to identify this loan.</div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Principal Loan Amount (MK)</label>
              <input
                type="number"
                required
                className="form-input"
                placeholder="e.g. 1500000"
                value={formData.loanAmount}
                onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
              />
              <div className="form-help">The original amount borrowed, without interest.</div>
            </div>
            <div className="form-group">
              <label className="form-label">Annual Interest Rate (%)</label>
              <input
                type="number"
                step="0.01"
                required
                className="form-input"
                placeholder="e.g. 24.5"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
              />
              <div className="form-help">Used to calculate your actual amortization.</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Loan Term (Months)</label>
              <input
                type="number"
                required
                className="form-input"
                placeholder="e.g. 36"
                value={formData.loanTermMonths}
                onChange={(e) => setFormData({ ...formData, loanTermMonths: e.target.value })}
              />
              <div className="form-help">The duration you agreed to pay the loan back in.</div>
            </div>
            <div className="form-group">
              <label className="form-label">Loan Start Date</label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <div className="form-help">Helps us calculate what you've paid off so far.</div>
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
