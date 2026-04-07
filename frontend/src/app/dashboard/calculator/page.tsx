"use client";
import { useState, useEffect, useMemo } from "react";
import styles from "./page.module.css";
import { calculateMonthlyInstallment } from "@/lib/eligibilityEngine";

export default function CalculatorPage() {
  const [profile, setProfile] = useState<{ monthlySalary: number; existingLoanAmount: number } | null>(null);
  const [amount, setAmount] = useState(500000);
  const [rate, setRate] = useState(24);
  const [months, setMonths] = useState(24);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(data => setProfile(data.profile));
  }, []);

  const installment = calculateMonthlyInstallment(amount, rate, months);
  const totalRepayable = installment * months;

  // Affordability Logic
  const salary = profile?.monthlySalary || 0;
  const existingDebt = profile?.existingLoanAmount || 0;
  const totalNewDebt = existingDebt + installment;
  const projectedDti = salary > 0 ? (totalNewDebt / salary) * 100 : 0;

  let affordability = { label: "Unknown", color: "var(--color-text-muted)", hint: "Complete profile for analysis" };
  if (salary > 0) {
    if (projectedDti > 50) affordability = { label: "High Risk / Unaffordable", color: "var(--color-danger)", hint: "DTI exceeds 50% threshold." };
    else if (projectedDti >= 30) affordability = { label: "Medium Risk / Caution", color: "var(--color-warning)", hint: "Approaching debt capacity limits." };
    else affordability = { label: "Low Risk / Affordable", color: "var(--color-success)", hint: "Well within your repayment capacity." };
  }

  const schedule: ScheduleRow[] = useMemo(() => {
    const rows: ScheduleRow[] = [];
    let balance = amount;
    const monthlyRate = rate / 100 / 12;
    for (let i = 1; i <= months; i++) {
      const interest = balance * monthlyRate;
      const principal = installment - interest;
      balance = Math.max(0, balance - principal);
      rows.push({ month: i, installment, interest, principal, balance });
    }
    return rows;
  }, [amount, rate, months, installment]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className="text-h2">Loan Calculator</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Simulate your repayments and view a full amortization schedule
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Controls */}
        <div className={`card ${styles.controls}`}>
          <h2 className="text-h3" style={{ marginBottom: "var(--space-lg)" }}>Loan Parameters</h2>

          <div className="form-group">
            <label className="form-label">Loan Amount: <strong>MK {amount.toLocaleString()}</strong></label>
            <input type="range" min={50000} max={5000000} step={50000}
              value={amount} onChange={e => setAmount(Number(e.target.value))}
              className={styles.slider} />
            <div className={styles.rangeLabels}><span>MK 50K</span><span>MK 5M</span></div>
          </div>

          <div className="form-group">
            <label className="form-label">Annual Interest Rate: <strong>{rate}%</strong></label>
            <input type="range" min={10} max={36} step={0.5}
              value={rate} onChange={e => setRate(Number(e.target.value))}
              className={styles.slider} />
            <div className={styles.rangeLabels}><span>10%</span><span>36%</span></div>
          </div>

          <div className="form-group">
            <label className="form-label">Repayment Period: <strong>{months} months ({(months/12).toFixed(1)} yrs)</strong></label>
            <input type="range" min={6} max={60} step={6}
              value={months} onChange={e => setMonths(Number(e.target.value))}
              className={styles.slider} />
            <div className={styles.rangeLabels}><span>6 mo</span><span>60 mo</span></div>
          </div>

          {profile && (
            <div className={styles.affordabilityBox}>
              <div className="text-xs" style={{ color: "var(--color-text-muted)", marginBottom: 4 }}>Affordability Indicator</div>
              <div style={{ fontWeight: 700, color: affordability.color, fontSize: "1.1rem" }}>{affordability.label}</div>
              <p className="text-xs" style={{ marginTop: 4 }}>{affordability.hint}</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <div className={`card ${styles.summaryCard}`}>
            <div className="stat-label">Monthly Installment</div>
            <div className="stat-value text-gradient">
              MK {installment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className={`card ${styles.summaryCard}`}>
            <div className="stat-label">Projected DTI</div>
            <div className="stat-value" style={{ color: affordability.color }}>
              {projectedDti.toFixed(1)}%
            </div>
          </div>
          <div className={`card ${styles.summaryCard}`}>
            <div className="stat-label">Total Repayable</div>
            <div className="stat-value">
              MK {totalRepayable.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className={`card ${styles.summaryCard} ${styles.insightsCard}`}>
             <h4 className="text-xs" style={{ color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Insights</h4>
             <p className="text-sm" style={{ marginTop: 8 }}>
               {projectedDti > 50 
                 ? "Warning: You are over-leveraged for this amount." 
                 : projectedDti < 20 
                   ? "Good news! You qualify for higher loan capacity." 
                   : "Your request is within reasonable limits."}
             </p>
          </div>
        </div>
      </div>

      {/* Amortization Table */}
      <div className={styles.scheduleSection}>
        <h2 className="text-h3">Amortization Schedule</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Installment (MK)</th>
                <th>Principal (MK)</th>
                <th>Interest (MK)</th>
                <th>Balance (MK)</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map(row => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td>{row.installment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td style={{ color: "var(--color-success)" }}>
                    {row.principal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td style={{ color: "var(--color-warning)" }}>
                    {row.interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td style={{ color: "var(--color-text-secondary)" }}>
                    {row.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface ScheduleRow {
  month: number;
  installment: number;
  principal: number;
  interest: number;
  balance: number;
}
