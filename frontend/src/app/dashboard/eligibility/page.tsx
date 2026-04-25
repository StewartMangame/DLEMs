"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import type { CompareResult, InstitutionEligibilityResult } from "@/lib/eligibilityEngine";

export default function EligibilityPage() {
  const [profile, setProfile] = useState<any>(null);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loanAmount, setLoanAmount] = useState(500000);
  const [duration, setDuration] = useState(24);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => {
      if (d.profile) setProfile(d.profile);
    });
    fetch("/api/eligibility/institutions").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setInstitutions(d);
      else if (d.institutions) setInstitutions(d.institutions);
    });
  }, []);

  const runCheck = async () => {
    if (!profile) return;
    setLoading(true);
    
    // Map profile values to expected compare payload
    const payload = {
      monthlyNetSalary: profile.monthlyNetSalary || 0,
      existingMonthlyRepayments: profile.existingLoanAmount || 0,
      employmentCategory: profile.employmentCategory || 'private_sector',
      requestedAmount: loanAmount,
      requestedTermMonths: duration,
    };

    try {
      const res = await fetch("/api/eligibility/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult(data);
      setChecked(true);
    } catch (err) {
      console.error("Comparison failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className="text-h2">Multi-Bank Loan Comparison</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Discover where you are eligible to borrow and compare actual terms across Malawian lenders.
          </p>
        </div>
      </div>

      {!profile && (
        <div className="alert alert-warning">
          ⚠ You need to complete your{" "}
          <Link href="/dashboard/profile">financial profile</Link> before generating a comparison.
        </div>
      )}

      {/* Loan Parameters */}
      <div className={`card ${styles.paramsCard}`}>
        <h2 className="text-h3" style={{ marginBottom: "var(--space-lg)" }}>What do you need?</h2>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="loanAmount">Requested Amount (MK)</label>
            <input id="loanAmount" type="number" min={50000} step={50000} className="form-input"
              value={loanAmount} onChange={e => setLoanAmount(Number(e.target.value))} />
            <div className="form-help">MK {loanAmount.toLocaleString()}</div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="duration">Repayment Period</label>
            <select id="duration" className="form-select" value={duration} onChange={e => setDuration(Number(e.target.value))}>
              {[3, 6, 12, 18, 24, 36, 48, 60].map(m => (
                <option key={m} value={m}>{m} months ({(m / 12).toFixed(1)} years)</option>
              ))}
            </select>
            <div className="form-help">Choose your comfortable repayment timeframe</div>
          </div>
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={runCheck}
          disabled={!profile || loading}
          style={{ marginTop: "var(--space-lg)", width: "100%" }}
        >
          {loading ? <><span className="loading-spinner" /> Scanning Lenders…</> : "✦ Compare Eligible Lenders"}
        </button>
      </div>

      {/* Results */}
      {checked && result && (
        <div className={`${styles.results} animate-fadeInUp`}>
          <div className={styles.profileSummaryRow} style={{ marginBottom: "2rem" }}>
            <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Based on your net salary of <strong>MK {result.profileSummary.salary.toLocaleString()}</strong> 
               and existing deductions of <strong>MK {result.profileSummary.existingRepayments.toLocaleString()}</strong>.
            </div>
          </div>

          <h3 className="text-h2" style={{ marginBottom: "1rem", color: "var(--color-success)" }}>
            Top Eligible Matches
          </h3>
          
          {result.ranked.length === 0 ? (
            <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
              No lenders matched your requested amount and profile. Check the ineligible list below to see why.
            </div>
          ) : (
            <div className={styles.bankGrid}>
              {result.ranked.map(inst => (
                <div key={inst.institutionId} className={`card ${styles.bankCard} ${inst.rank === 1 ? styles.topRanked : ""}`}>
                  {inst.rank === 1 && <div className="badge badge-success" style={{ position: 'absolute', top: -10, right: 20 }}>Best Match</div>}
                  <h3 style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: "4px" }}>
                    {inst.rank}. {inst.institutionName}
                  </h3>
                  <div className="text-sm text-muted" style={{ marginBottom: "1rem" }}>{inst.institutionType}</div>
                  
                  <div className="grid-2" style={{ gap: "1rem", marginBottom: "1.5rem" }}>
                    <div>
                      <div className="text-xs text-muted">Interest Rate</div>
                      <div style={{ fontWeight: 600 }}>{inst.interestRate}% p.a.</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Processing Fee</div>
                      <div style={{ fontWeight: 600 }}>{inst.processingFeePercent}% (MK {inst.processingFee.toLocaleString()})</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Est. Monthly Payment</div>
                      <div style={{ fontWeight: 800, color: "var(--color-primary)" }}>MK {inst.estimatedMonthlyInstallment.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Max Capacity</div>
                      <div style={{ fontWeight: 600 }}>MK {inst.maxLoanAmount.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="text-sm" style={{ color: "var(--color-text-secondary)", marginBottom: "1.5rem", minHeight: "3rem" }}>
                    {inst.notes}
                  </div>

                  <div style={{ padding: "0.8rem", background: "rgba(0, 200, 150, 0.1)", borderRadius: "var(--radius-md)", textAlign: "center", color: "var(--color-success)", fontSize: "0.9rem", fontWeight: 500 }}>
                    <span style={{ display: "block", marginBottom: "4px" }}>✓ Pre-qualified</span>
                    Visit any {inst.institutionName} branch to proceed.
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.ineligible.length > 0 && (
            <>
              <h3 className="text-h3" style={{ marginTop: "3rem", marginBottom: "1rem", color: "var(--color-text-muted)" }}>
                Other Institutions (Not Eligible)
              </h3>
              <div className="grid-2" style={{ gap: "1rem" }}>
                {result.ineligible.map(inst => (
                  <div key={inst.institutionId} className="card" style={{ opacity: 0.7, borderLeft: "4px solid var(--color-danger)", padding: "1.5rem" }}>
                    <h4 style={{ fontWeight: 600 }}>{inst.institutionName}</h4>
                    <div className="text-sm" style={{ color: "var(--color-danger)", marginTop: "0.5rem" }}>
                      ✗ {inst.ineligibilityReason}
                    </div>
                    {inst.maxLoanAmount > 0 && (
                      <div className="text-xs" style={{ marginTop: "0.5rem", color: "var(--color-text-secondary)" }}>
                        (Max capacity: MK {inst.maxLoanAmount.toLocaleString()})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Pre-computation browse state */}
      {!checked && !loading && institutions.length > 0 && (
        <div style={{ marginTop: "3rem" }}>
          <h3 className="text-h3" style={{ marginBottom: "1rem" }}>Available Lenders on DLEM</h3>
          <div className="grid-3" style={{ gap: "1rem" }}>
            {institutions.map(inst => (
              <div key={inst.id} className="card" style={{ padding: "1.5rem" }}>
                <h4 style={{ marginBottom: "0.5rem" }}>{inst.name}</h4>
                <div className="badge badge-neutral text-xs">{inst.type}</div>
                {inst.criteria && (
                  <div className="text-xs" style={{ color: "var(--color-text-secondary)", marginTop: "1rem" }}>
                    Offers {inst.criteria.interestRate}% interest rates up to {inst.criteria.maxRepaymentMonths} months.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
