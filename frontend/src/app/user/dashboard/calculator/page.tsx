"use client";

import { useState, useEffect, useMemo } from "react";
import styles from "./page.module.css";
import { calculateMonthlyInstallment } from "@/lib/eligibilityEngine";

// Types and Interfaces
interface Profile {
  monthlySalary: number;
  existingLoanAmount: number;
}

interface ScheduleRow {
  month: number;
  installment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface AffordabilityResult {
  label: string;
  color: string;
  hint: string;
}

// Constants for loan parameters and thresholds
const LOAN_CONFIG = {
  MIN_AMOUNT: 50000,
  MAX_AMOUNT: 50000000,
  STEP_AMOUNT: 50000,
  MIN_RATE: 10,
  MAX_RATE: 36,
  STEP_RATE: 0.5,
  MIN_MONTHS: 6,
  MAX_MONTHS: 60,
  STEP_MONTHS: 6,
  DTI_THRESHOLD_HIGH: 50,
  DTI_THRESHOLD_MEDIUM: 30,
} as const;

// Helper functions
const formatCurrency = (value: number): string => {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const calculateAffordability = (salary: number, totalNewDebt: number): AffordabilityResult => {
  if (salary <= 0) {
    return {
      label: "Unknown",
      color: "var(--color-text-muted)",
      hint: "Complete profile for analysis",
    };
  }

  const dti = (totalNewDebt / salary) * 100;

  if (dti > LOAN_CONFIG.DTI_THRESHOLD_HIGH) {
    return {
      label: "High Risk / Unaffordable",
      color: "var(--color-danger)",
      hint: "DTI exceeds 50% threshold.",
    };
  }

  if (dti >= LOAN_CONFIG.DTI_THRESHOLD_MEDIUM) {
    return {
      label: "Medium Risk / Caution",
      color: "var(--color-warning)",
      hint: "Approaching debt capacity limits.",
    };
  }

  return {
    label: "Low Risk / Affordable",
    color: "var(--color-success)",
    hint: "Well within your repayment capacity.",
  };
};

const getInsightMessage = (dti: number): string => {
  if (dti > LOAN_CONFIG.DTI_THRESHOLD_HIGH) {
    return "Warning: You are over-leveraged for this amount.";
  }
  if (dti < 20) {
    return "Good news! You qualify for higher loan capacity.";
  }
  return "Your request is within reasonable limits.";
};

export default function CalculatorPage() {
  // State variables and profile data
  const [profile, setProfile] = useState<Profile | null>(null);
  const [amount, setAmount] = useState(500000);
  const [rate, setRate] = useState(24);
  const [months, setMonths] = useState(24);

  // Effects section to fetch user profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        const data = await response.json();
        setProfile(data.profile);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    fetchProfile();
  }, []);

  // Memoized calculations for installment, total repayable, DTI, affordability, insights, and amortization schedule
  const installment = useMemo(
    () => calculateMonthlyInstallment(amount, rate, months),
    [amount, rate, months]
  );

  const totalRepayable = useMemo(
    () => installment * months,
    [installment, months]
  );

  const salary = profile?.monthlySalary ?? 0;
  const existingDebt = profile?.existingLoanAmount ?? 0;
  const totalNewDebt = existingDebt + installment;
  const projectedDti = salary > 0 ? (totalNewDebt / salary) * 100 : 0;

  const affordability = useMemo(
    () => calculateAffordability(salary, totalNewDebt),
    [salary, totalNewDebt]
  );

  const insightMessage = useMemo(
    () => getInsightMessage(projectedDti),
    [projectedDti]
  );

  const schedule = useMemo(() => {
    const rows: ScheduleRow[] = [];
    let balance = amount;
    const monthlyRate = rate / 100 / 12;

    for (let month = 1; month <= months; month++) {
      const interest = balance * monthlyRate;
      const principal = installment - interest;
      balance = Math.max(0, balance - principal);

      rows.push({
        month,
        installment,
        interest,
        principal,
        balance,
      });
    }

    return rows;
  }, [amount, rate, months, installment]);

  // Render helpers for sliders and other UI components
  const renderSlider = (
    label: string,
    value: number,
    setValue: (value: number) => void,
    min: number,
    max: number,
    step: number,
    formatValue: (value: number) => string,
    minLabel: string,
    maxLabel: string
  ) => (
    <div className="form-group">
      <label className="form-label">
        {label}: <strong>{formatValue(value)}</strong>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className={styles.slider}
      />
      <div className={styles.rangeLabels}>
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className="text-h2">Loan Calculator</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Simulate your repayments and view a full amortization schedule
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.grid}>
        {/* Controls Section */}
        <div className={`card ${styles.controls}`}>
          <h2 className="text-h3" style={{ marginBottom: "var(--space-lg)" }}>
            Loan Parameters
          </h2>

          {renderSlider(
            "Loan Amount",
            amount,
            setAmount,
            LOAN_CONFIG.MIN_AMOUNT,
            LOAN_CONFIG.MAX_AMOUNT,
            LOAN_CONFIG.STEP_AMOUNT,
            (v) => `MK ${formatCurrency(v)}`,
            "MK 50K",
            "MK 5M"
          )}

          {renderSlider(
            "Annual Interest Rate",
            rate,
            setRate,
            LOAN_CONFIG.MIN_RATE,
            LOAN_CONFIG.MAX_RATE,
            LOAN_CONFIG.STEP_RATE,
            (v) => `${v}%`,
            "10%",
            "36%"
          )}

          {renderSlider(
            "Repayment Period",
            months,
            setMonths,
            LOAN_CONFIG.MIN_MONTHS,
            LOAN_CONFIG.MAX_MONTHS,
            LOAN_CONFIG.STEP_MONTHS,
            (v) => `${v} months (${(v / 12).toFixed(1)} yrs)`,
            "6 mo",
            "60 mo"
          )}

          {profile && (
            <div className={styles.affordabilityBox}>
              <div
                className="text-xs"
                style={{ color: "var(--color-text-muted)", marginBottom: 4 }}
              >
                Affordability Indicator
              </div>
              <div
                style={{
                  fontWeight: 700,
                  color: affordability.color,
                  fontSize: "1.1rem",
                }}
              >
                {affordability.label}
              </div>
              <p className="text-xs" style={{ marginTop: 4 }}>
                {affordability.hint}
              </p>
            </div>
          )}
        </div>

        {/* Summary Section */}
        <div className={styles.summary}>
          <div className={`card ${styles.summaryCard}`}>
            <div className="stat-label">Monthly Installment</div>
            <div className="stat-value text-gradient">
              MK {formatCurrency(installment)}
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
              MK {formatCurrency(totalRepayable)}
            </div>
          </div>

          <div className={`card ${styles.summaryCard} ${styles.insightsCard}`}>
            <h4
              className="text-xs"
              style={{
                color: "var(--color-primary)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Insights
            </h4>
            <p className="text-sm" style={{ marginTop: 8 }}>
              {insightMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Amortization Schedule */}
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
              {schedule.map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td>{formatCurrency(row.installment)}</td>
                  <td style={{ color: "var(--color-success)" }}>
                    {formatCurrency(row.principal)}
                  </td>
                  <td style={{ color: "var(--color-warning)" }}>
                    {formatCurrency(row.interest)}
                  </td>
                  <td style={{ color: "var(--color-text-secondary)" }}>
                    {formatCurrency(row.balance)}
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