"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import type { EligibilityResult } from "@/lib/eligibilityEngine";

interface ProfileData {
  employmentType: string;
  monthlyNetSalary: number;
  employmentYears: number;
  age: number;
  housingStatus: string;
  existingLoanAmount: number;
  bankingYears: number;
  salaryInstitutionId: number;
}

interface BankSimulation {
  institutionId: number;
  bank: string;
  eligible: boolean;
  maxAmount: number;
  riskLevel: string;
  rate: number;
}

export default function EligibilityPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loanAmount, setLoanAmount] = useState(500000);
  const [duration, setDuration] = useState(24);
  const [selectedInstId, setSelectedInstId] = useState("");
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [bankSimulations, setBankSimulations] = useState<BankSimulation[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => { 
      if (d.profile) {
        setProfile(d.profile);
        if (d.profile.salaryInstitutionId) setSelectedInstId(d.profile.salaryInstitutionId.toString());
      }
    });
    fetch("/api/institutions").then(r => r.json()).then(d => { if (d.institutions) setInstitutions(d.institutions); });
  }, []);

  const runCheck = async () => {
    if (!profile || !selectedInstId) return;
    setLoading(true);
    const res = await fetch("/api/eligibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...profile, monthlySalary: profile.monthlyNetSalary, loanAmount, durationMonths: duration, institutionId: parseInt(selectedInstId) }),
    });
    const data = await res.json();
    setResult(data.result);
    setBankSimulations(data.bankSimulations || []);
    setChecked(true);
    setLoading(false);
  };

  const scoreColor = (score: number) => {
    if (score >= 100) return "var(--color-success)";
    if (score >= 80) return "var(--color-info)";
    if (score >= 60) return "var(--color-warning)";
    return "var(--color-danger)";
  };

  const selectedBankName = institutions.find(i => i.id.toString() === selectedInstId)?.name || "";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className="text-h2">Loan Eligibility Checker</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {selectedInstId 
              ? `Automated risk assessment based on ${selectedBankName} criteria`
              : "Select a bank to check your loan eligibility"}
          </p>
        </div>
      </div>

      {!profile && (
        <div className="alert alert-warning">
          ⚠ You need to complete your{" "}
          <Link href="/dashboard/profile">financial profile</Link> before running an eligibility check.
        </div>
      )}

      {/* Loan Parameters */}
      <div className={`card ${styles.paramsCard}`}>
        <h2 className="text-h3" style={{ marginBottom: "var(--space-lg)" }}>Loan Parameters</h2>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="bank">Select Lending Bank</label>
            <select id="bank" className="form-select" value={selectedInstId} onChange={e => setSelectedInstId(e.target.value)}>
              <option value="">— Choose a bank —</option>
              {institutions.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.type})</option>
              ))}
            </select>
            <div className="form-help">Eligibility rules vary by bank</div>
          </div>
          <div className="form-group" />
          
          <div className="form-group">
            <label className="form-label" htmlFor="loanAmount">Requested Loan Amount (MK)</label>
            <input id="loanAmount" type="number" min={50000} step={50000} className="form-input"
              value={loanAmount} onChange={e => setLoanAmount(Number(e.target.value))} />
            <div className="form-help">MK {loanAmount.toLocaleString()}</div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="duration">Repayment Period (months)</label>
            <select id="duration" className="form-select" value={duration} onChange={e => setDuration(Number(e.target.value))}>
              {[6, 12, 18, 24, 36, 48, 60].map(m => (
                <option key={m} value={m}>{m} months ({(m/12).toFixed(1)} years)</option>
              ))}
            </select>
          </div>
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={runCheck}
          disabled={!profile || !selectedInstId || loading}
          style={{ marginTop: "var(--space-lg)" }}
        >
          {loading ? <><span className="loading-spinner" /> Assessing…</> : "✦ Run Eligibility Check"}
        </button>
      </div>

      {/* Results */}
      {checked && result && (
        <div className={`${styles.results} animate-fadeInUp`}>
          {/* Verdict */}
          <div className={`card ${styles.verdictCard} ${result.eligible ? styles.verdictPass : styles.verdictFail}`}>
            <div className={styles.verdictIcon}>{result.eligible ? "✓" : "✗"}</div>
            <div>
              <h2 className="text-h2">
                {selectedBankName} Verdict: {result.eligible ? "Eligible" : "Not Eligible"}
              </h2>
              <p style={{ color: "var(--color-text-secondary)" }}>
                {result.eligible
                  ? `You meet the lending criteria for ${selectedBankName}.`
                  : `Your application does not meet the requirements for ${selectedBankName} at this time.`}
              </p>
            </div>
            {result.eligible && (
              <Link 
                href={`/dashboard/apply?institutionId=${selectedInstId}&amount=${loanAmount}&duration=${duration}`} 
                className="btn btn-primary btn-lg"
                style={{ marginLeft: "auto" }}
              >
                Apply Now →
              </Link>
            )}
          </div>

          <div className={styles.bankGrid}>
            <h3 className="text-h3" style={{ gridColumn: "1/-1" }}>Other Bank Comparisons</h3>
            {bankSimulations.filter(s => s.institutionId.toString() !== selectedInstId).map((sim, i) => (
              <div key={i} className={`card ${styles.bankCard} ${sim.eligible ? "" : styles.bankIneligible}`}>
                <div className={styles.bankLogo}>🏛</div>
                <h4 style={{ fontWeight: 700 }}>{sim.bank}</h4>
                <div className="badge badge-neutral" style={{ marginTop: 8 }}>{sim.riskLevel} Risk</div>
                <div className={styles.bankStatus}>
                  {sim.eligible ? (
                    <span style={{ color: "var(--color-success)" }}>● Eligible</span>
                  ) : (
                    <span style={{ color: "var(--color-danger)" }}>● Not Eligible</span>
                  )}
                </div>
                {sim.eligible ? (
                  <>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)", marginTop: 12 }}>Max Limit</div>
                    <div className="text-sm" style={{ fontWeight: 600 }}>MK {sim.maxAmount.toLocaleString()}</div>
                    <button 
                      onClick={() => { setSelectedInstId(sim.institutionId.toString()); setTimeout(runCheck, 100); }}
                      className="btn btn-outline btn-sm" 
                      style={{ marginTop: 16, width: "100%" }}
                    >
                      Check this bank
                    </button>
                  </>
                ) : (
                  <div style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Criteria not met
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid-2">
            {/* Risk Score */}
            <div className={`card ${styles.scoreCard}`}>
              <h3 className="text-h3">Risk Score</h3>
              <div className={styles.scoreCircle}>
                <svg viewBox="0 0 120 120" className={styles.scoreSvg}>
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-border)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke={scoreColor(result.riskScore)} strokeWidth="8"
                    strokeDasharray={`${(result.riskScore / 120) * 326.7} 326.7`}
                    strokeDashoffset="81.7" strokeLinecap="round"
                    style={{ transition: "stroke-dasharray 1s ease" }}
                  />
                </svg>
                <div className={styles.scoreLabel}>
                  <div className={styles.scoreNum} style={{ color: scoreColor(result.riskScore) }}>
                    {result.riskScore}
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>/120</div>
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <span className={`badge ${RISK_BADGE[result.riskCategory]}`}>
                  {result.riskCategory}
                </span>
              </div>
            </div>

            {/* Financials */}
            <div className={`card ${styles.financialsCard}`}>
              <h3 className="text-h3">Loan Financials</h3>
              <div className={styles.financialRows}>
                <div className={styles.finRow}>
                  <span>Monthly Installment</span>
                  <strong style={{ color: "var(--color-primary)" }}>
                    MK {result.monthlyInstallment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </strong>
                </div>
                <div className={styles.finRow}>
                  <span>Total Repayable</span>
                  <strong>MK {result.totalRepayable.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                </div>
                <div className={styles.finRow}>
                  <span>DTI Ratio</span>
                  <strong style={{ color: result.dtiRatio > 33 ? "var(--color-danger)" : "var(--color-success)" }}>
                    {(result.dtiRatio).toFixed(1)}%
                  </strong>
                </div>

                <div className={styles.finRow}>
                  <span>Max You Can Borrow</span>
                  <strong style={{ color: "var(--color-success)" }}>
                    MK {result.maxLoanAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className={`card ${styles.breakdownCard}`}>
            <h3 className="text-h3">Score Breakdown</h3>
            <div className={styles.breakdownGrid}>
              {SCORE_ROWS(result.breakdown).map(row => (
                <div key={row.label} className={styles.breakdownRow}>
                  <div className={styles.breakdownLabel}>
                    <span>{row.label}</span>
                    <span style={{ color: "var(--color-primary)" }}>
                      {row.score ?? 0}<span style={{ color: "var(--color-text-muted)" }}>/{row.max}</span>
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${((row.score ?? 0) / row.max) * 100}%`, background: row.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const RISK_BADGE: Record<string, string> = {
  EXCELLENT: "badge-success", GOOD: "badge-info", FAIR: "badge-warning", POOR: "badge-danger",
};

const SCORE_ROWS = (b: EligibilityResult["breakdown"]) => [
  { label: "Employment Type", score: b.employment, max: 40, color: "var(--color-primary)" },
  { label: "Employment Duration", score: b.employmentYears, max: 30, color: "var(--color-info)" },
  { label: "Age Band", score: b.age, max: 20, color: "var(--color-success)" },
  { label: "Housing Stability", score: b.housing, max: 15, color: "var(--color-warning)" },
  { label: "Banking History", score: b.banking, max: 15, color: "#a78bfa" },
];
