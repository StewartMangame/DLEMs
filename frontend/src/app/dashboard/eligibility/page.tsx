"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { useLanguage } from "@/lib/LanguageContext";
import type { CompareResult } from "@/lib/eligibilityEngine";

interface FinancialProfile {
  monthlyNetSalary?: number;
  existingLoanAmount?: number;
  employmentCategory?: string;
}

interface Institution {
  id: number;
  name: string;
  type: string;
  criteria?: {
    interestRate: number;
    maxRepaymentMonths: number;
  } | null;
}

export default function EligibilityPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loanAmount, setLoanAmount] = useState(500000);
  const [duration, setDuration] = useState(24);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then(res => res.json())
      .then(data => {
        if (data.profile) setProfile(data.profile);
      });

    fetch("/api/eligibility/institutions")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setInstitutions(data);
        else if (Array.isArray(data.institutions)) setInstitutions(data.institutions);
      });
  }, []);

  const runCheck = async () => {
    if (!profile) return;
    setLoading(true);

    const payload = {
      monthlyNetSalary: profile.monthlyNetSalary || 0,
      existingMonthlyRepayments: profile.existingLoanAmount || 0,
      employmentCategory: profile.employmentCategory || "private_sector",
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
          <h1 className="text-h2">{t("eligibility.title")}</h1>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {t("eligibility.subtitle")}
          </p>
        </div>
      </div>

      {!profile && (
        <div className="alert alert-warning">
          {t("eligibility.profileRequired")}{" "}
          <Link href="/dashboard/profile">{t("eligibility.profileLink")}</Link>{" "}
          {t("eligibility.profileRequiredEnd")}
        </div>
      )}

      <div className={`card ${styles.paramsCard}`}>
        <h2
          className="text-h3"
          style={{ marginBottom: "var(--space-lg)" }}
        >
          {t("eligibility.parameters")}
        </h2>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="loanAmount">
              {t("eligibility.amount")}
            </label>
            <input
              id="loanAmount"
              type="number"
              min={50000}
              step={50000}
              className="form-input"
              value={loanAmount}
              onChange={event => setLoanAmount(Number(event.target.value))}
            />
            <div className="form-help">MK {loanAmount.toLocaleString()}</div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="duration">
              {t("eligibility.period")}
            </label>
            <select
              id="duration"
              className="form-select"
              value={duration}
              onChange={event => setDuration(Number(event.target.value))}
            >
              {[3, 6, 12, 18, 24, 36, 48, 60].map(months => (
                <option key={months} value={months}>
                  {months} {t("eligibility.months")} ({(months / 12).toFixed(1)}{" "}
                  {t("eligibility.years")})
                </option>
              ))}
            </select>
            <div className="form-help">{t("eligibility.periodHelp")}</div>
          </div>
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={runCheck}
          disabled={!profile || loading}
          style={{ marginTop: "var(--space-lg)", width: "100%" }}
        >
          {loading ? (
            <>
              <span className="loading-spinner" /> {t("eligibility.loading")}
            </>
          ) : (
            t("eligibility.compare")
          )}
        </button>
      </div>

      {checked && result && (
        <div className={`${styles.results} animate-fadeInUp`}>
          <div
            className={styles.profileSummaryRow}
            style={{ marginBottom: "2rem" }}
          >
            <div
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {t("eligibility.summarySalary")}{" "}
              <strong>MK {result.profileSummary.salary.toLocaleString()}</strong>{" "}
              {t("eligibility.summaryDeductions")}{" "}
              <strong>
                MK {result.profileSummary.existingRepayments.toLocaleString()}
              </strong>
              .
            </div>
          </div>

          <h3
            className="text-h2"
            style={{ marginBottom: "1rem", color: "var(--color-success)" }}
          >
            {t("eligibility.topMatches")}
          </h3>

          {result.ranked.length === 0 ? (
            <div
              className="card"
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "var(--color-text-muted)",
              }}
            >
              {t("eligibility.noMatches")}
            </div>
          ) : (
            <div className={styles.bankGrid}>
              {result.ranked.map(inst => (
                <div
                  key={inst.institutionId}
                  className={`card ${styles.bankCard} ${
                    inst.rank === 1 ? styles.topRanked : ""
                  }`}
                >
                  {inst.rank === 1 && (
                    <div
                      className="badge badge-success"
                      style={{ position: "absolute", top: -10, right: 20 }}
                    >
                      {t("eligibility.bestMatch")}
                    </div>
                  )}
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: "1.2rem",
                      marginBottom: "4px",
                    }}
                  >
                    {inst.rank}. {inst.institutionName}
                  </h3>
                  <div
                    className="text-sm text-muted"
                    style={{ marginBottom: "1rem" }}
                  >
                    {inst.institutionType}
                  </div>

                  <div
                    className="grid-2"
                    style={{ gap: "1rem", marginBottom: "1.5rem" }}
                  >
                    <div>
                      <div className="text-xs text-muted">
                        {t("eligibility.interestRate")}
                      </div>
                      <div style={{ fontWeight: 600 }}>
                        {inst.interestRate}% p.a.
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">
                        {t("eligibility.processingFee")}
                      </div>
                      <div style={{ fontWeight: 600 }}>
                        {inst.processingFeePercent}% (MK{" "}
                        {inst.processingFee.toLocaleString()})
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">
                        {t("eligibility.monthlyPayment")}
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: "var(--color-primary)",
                        }}
                      >
                        MK {inst.estimatedMonthlyInstallment.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">
                        {t("eligibility.maxCapacity")}
                      </div>
                      <div style={{ fontWeight: 600 }}>
                        MK {inst.maxLoanAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div
                    className="text-sm"
                    style={{
                      color: "var(--color-text-secondary)",
                      marginBottom: "1.5rem",
                      minHeight: "3rem",
                    }}
                  >
                    {inst.notes}
                  </div>

                  <div
                    style={{
                      padding: "0.8rem",
                      background: "rgba(0, 200, 150, 0.1)",
                      borderRadius: "var(--radius-md)",
                      textAlign: "center",
                      color: "var(--color-success)",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    <span style={{ display: "block", marginBottom: "4px" }}>
                      {t("eligibility.prequalified")}
                    </span>
                    {t("eligibility.visitBranch", {
                      institution: inst.institutionName,
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.ineligible.length > 0 && (
            <>
              <h3
                className="text-h3"
                style={{
                  marginTop: "3rem",
                  marginBottom: "1rem",
                  color: "var(--color-text-muted)",
                }}
              >
                {t("eligibility.otherInstitutions")}
              </h3>
              <div className="grid-2" style={{ gap: "1rem" }}>
                {result.ineligible.map(inst => (
                  <div
                    key={inst.institutionId}
                    className="card"
                    style={{
                      opacity: 0.7,
                      borderLeft: "4px solid var(--color-danger)",
                      padding: "1.5rem",
                    }}
                  >
                    <h4 style={{ fontWeight: 600 }}>{inst.institutionName}</h4>
                    <div
                      className="text-sm"
                      style={{
                        color: "var(--color-danger)",
                        marginTop: "0.5rem",
                      }}
                    >
                      {inst.ineligibilityReason}
                    </div>
                    {inst.maxLoanAmount > 0 && (
                      <div
                        className="text-xs"
                        style={{
                          marginTop: "0.5rem",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {t("eligibility.maxCapacity")}: MK{" "}
                        {inst.maxLoanAmount.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!checked && !loading && institutions.length > 0 && (
        <div style={{ marginTop: "3rem" }}>
          <h3 className="text-h3" style={{ marginBottom: "1rem" }}>
            {t("eligibility.availableLenders")}
          </h3>
          <div className="grid-3" style={{ gap: "1rem" }}>
            {institutions.map(inst => (
              <div key={inst.id} className="card" style={{ padding: "1.5rem" }}>
                <h4 style={{ marginBottom: "0.5rem" }}>{inst.name}</h4>
                <div className="badge badge-neutral text-xs">{inst.type}</div>
                {inst.criteria && (
                  <div
                    className="text-xs"
                    style={{
                      color: "var(--color-text-secondary)",
                      marginTop: "1rem",
                    }}
                  >
                    {t("eligibility.offers", {
                      rate: inst.criteria.interestRate,
                      months: inst.criteria.maxRepaymentMonths,
                    })}
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
