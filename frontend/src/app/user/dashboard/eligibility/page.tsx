"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { useLanguage } from "@/lib/LanguageContext";
import { checkEligibility } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

interface FinancialProfile {
  monthlyNetSalary?: number;
  existingLoanAmount?: number;
  employmentCategory?: string;
}

interface Institution {
  id: string;
  name: string;
  type: string;
  logoUrl?: string;
  criteria?: {
    interestRate: number;
    maxRepaymentMonths: number;
  } | null;
}

interface ApiEligibilityResult {
  institution_id: string;
  institution_name: string;
  result: "LIKELY_ELIGIBLE" | "BORDERLINE" | "NOT_ELIGIBLE" | "NOT_YET_ELIGIBLE";
  reason: string;
  max_loan_amount: number | null;
  available_monthly_repayment: number | null;
}

async function readJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String(body.message)
        : typeof body === "string" && body.trim()
          ? body
          : `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  if (typeof body === "string") {
    throw new Error("The server returned a non-JSON response.");
  }

  return body as T;
}

const LENDER_LOGOS: Record<string, string> = {
  "FDH Bank": "/logos/fdh.png",
  "Malawi Police SACCO": "/logos/sacco.png",
  "FINCA Malawi": "/logos/finca.png",
};

function lenderLogo(name: string, institutions: Institution[]) {
  return institutions.find(i => i.name === name)?.logoUrl || LENDER_LOGOS[name];
}

export default function EligibilityPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitutionIds, setSelectedInstitutionIds] = useState<string[]>([]);
  const [loanAmount, setLoanAmount] = useState(500000);
  const [duration, setDuration] = useState(24);
  const [result, setResult] = useState<ApiEligibilityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then(res => readJsonResponse<{ profile?: FinancialProfile }>(res))
      .then(data => {
        if (data.profile) setProfile(data.profile);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      });

    fetch("/api/institutions", { cache: "no-store" })
      .then(res => readJsonResponse<Institution[] | { institutions?: Institution[] }>(res))
      .then(data => {
        const list = Array.isArray(data) ? data : (data.institutions || []);
        setInstitutions(list);
        setSelectedInstitutionIds(list.map(inst => inst.id));
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "Failed to load institutions.");
      });
  }, []);

  const runCheck = async () => {
    if (!profile || selectedInstitutionIds.length === 0) return;
    setLoading(true);
    setError(null);

    const payload = {
      monthly_net_income: profile.monthlyNetSalary || 0,
      employment_category: profile.employmentCategory?.toUpperCase?.() || "PRIVATE_SECTOR",
      length_of_service_months: 0,
      existing_monthly_obligations: profile.existingLoanAmount || 0,
      sacco_membership_months: null,
      has_crb_flag: false,
      is_business_owner: null,
      group_size: null,
      has_finca_account: null,
      requested_amount: loanAmount,
      requested_term_months: duration,
    };

    try {
      const data = await checkEligibility(payload, selectedInstitutionIds);
      setResult(Array.isArray(data) ? data : []);
      setChecked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link href="/user/dashboard" className="btn btn-ghost btn-sm" style={{ gap: "8px", marginBottom: "var(--space-md)" }}>
            <ArrowLeft size={16} /> Back
          </Link>
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
          <Link href="/user/dashboard/profile">{t("eligibility.profileLink")}</Link>{" "}
          {t("eligibility.profileRequiredEnd")}
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

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

        <div className="form-group" style={{ marginTop: "var(--space-md)" }}>
          <label className="form-label" htmlFor="institution-selection">
            {t("eligibility.selectInstitution", { default: "Select Institutions" })}
          </label>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-sm)" }}>
            {t("eligibility.compareAllLendersInfo")}
          </p>
          <div className="checkbox-group" id="institution-selection" style={{ display: "grid", gap: "0.75rem" }}>
            {institutions.map(inst => (
              <label key={inst.id} className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <input
                  type="checkbox"
                  checked={selectedInstitutionIds.includes(inst.id)}
                  onChange={() => {
                    setSelectedInstitutionIds(prev =>
                      prev.includes(inst.id)
                        ? prev.filter(id => id !== inst.id)
                        : [...prev, inst.id]
                    );
                  }}
                />
                <span>{inst.name}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary btn-lg"
          onClick={runCheck}
          disabled={!profile || loading || selectedInstitutionIds.length === 0}
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

      {checked && (
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
              <strong>MK {(profile?.monthlyNetSalary || 0).toLocaleString()}</strong>{" "}
              {t("eligibility.summaryDeductions")}{" "}
              <strong>
                MK {(profile?.existingLoanAmount || 0).toLocaleString()}
              </strong>
              .
            </div>
          </div>

          {result.length > 0 ? (
            result.map(inst => (
              <div
                key={inst.institution_id}
                className="card"
                style={{
                  padding: "1.5rem",
                  borderLeft: `4px solid ${
                    inst.result === "LIKELY_ELIGIBLE"
                      ? "var(--color-success)"
                      : inst.result === "NOT_ELIGIBLE"
                        ? "var(--color-danger)"
                        : "var(--color-warning)"
                  }`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                  {lenderLogo(inst.institution_name, institutions) && (
                    <span className={styles.resultLogoWrapper}>
                      <img
                        src={lenderLogo(inst.institution_name, institutions)}
                        alt={inst.institution_name}
                        className={styles.resultLogo}
                      />
                    </span>
                  )}
                  <h3 style={{ fontWeight: 700, fontSize: "1.2rem", margin: 0 }}>
                    {inst.institution_name}
                  </h3>
                </div>
                <div className="badge badge-neutral text-xs" style={{ marginBottom: "1rem" }}>
                  {inst.result.replaceAll("_", " ")}
                </div>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {inst.reason}
                </p>
                <div className="grid-2" style={{ gap: "1rem", marginTop: "1rem" }}>
                  <div>
                    <div className="text-xs text-muted">Available repayment</div>
                    <div style={{ fontWeight: 800, color: "var(--color-primary)" }}>
                      {inst.available_monthly_repayment ? `MK ${inst.available_monthly_repayment.toLocaleString()}` : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">{t("eligibility.maxCapacity")}</div>
                    <div style={{ fontWeight: 600 }}>
                      {inst.max_loan_amount ? `MK ${inst.max_loan_amount.toLocaleString()}` : "-"}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
              {t("eligibility.noMatches")}
            </div>
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
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                  {lenderLogo(inst.name, institutions) ? (
                    <span className={styles.availableLogoWrapper}>
                      <img src={lenderLogo(inst.name, institutions)} alt={inst.name} className={styles.availableLogo} />
                    </span>
                  ) : (
                    <div style={{ width: "40px", height: "40px", background: "var(--color-bg-alt)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center" }}>🏦</div>
                  )}
                  <div>
                    <h4 style={{ margin: 0 }}>{inst.name}</h4>
                    <div className="badge badge-neutral text-xs">{inst.type}</div>
                  </div>
                </div>
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
