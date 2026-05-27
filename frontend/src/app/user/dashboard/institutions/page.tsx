"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import {
  checkEligibility,
  fetchFincaProducts,
  fetchInstitutionCriteria,
  fetchInstitutions,
  fetchSaccoBranches,
} from "@/lib/api";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

type Step = "select" | "intake" | "results";

type Institution = {
  id: string;
  name: string;
  type: "COMMERCIAL_BANK" | "MICROFINANCE" | "SACCO_CATEGORY";
  has_branches: boolean;
  description: string;
  logoUrl: string | null;
  status: "ACTIVE" | "COMING_SOON";
};

type Branch = {
  id: string;
  branch_name: string;
  status: "ACTIVE" | "COMING_SOON";
};

type Product = {
  id: string;
  product_name: string;
  description: string;
  status: "ACTIVE" | "COMING_SOON";
};

type Criteria = {
  id: string;
  name: string;
  min_income: number;
  dti_cap_percent: number;
  loan_products: {
    product_name: string;
    min_amount: number;
    max_amount: number;
    interest_rate_fixed: boolean;
    interest_rate_value: number | null;
    repayment_periods: number[];
    processing_fee_percent: number;
  }[];
  required_documents: string[];
  turnaround_time: string;
  crb_check_required: boolean;
};

type EligibilityResult = {
  institution_id: string;
  institution_name: string;
  result:
    | "LIKELY_ELIGIBLE"
    | "BORDERLINE"
    | "NOT_ELIGIBLE"
    | "NOT_YET_ELIGIBLE";
  reason: string;
  max_loan_amount: number | null;
  available_monthly_repayment: number | null;
  loan_products: { product_name: string; min_amount: number; max_amount: number }[];
};

const STEPS: Step[] = ["select", "intake", "results"];
const STEP_LABELS: Record<Step, string> = {
  select: "Select Institution",
  intake: "Additional Details",
  results: "Eligibility Results",
};

const LOGOS: Record<string, string> = {
  "FDH Bank": "/logos/fdh.png",
  "FINCA Malawi": "/logos/finca.png",
  "Malawi Police SACCO": "/logos/sacco.png",
};

const currency = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "-"
    : `MK ${Math.round(value).toLocaleString()}`;

function logoFor(institution: Institution) {
  return institution.logoUrl || LOGOS[institution.name];
}

function resultColor(result: EligibilityResult["result"]) {
  if (result === "LIKELY_ELIGIBLE") return "var(--color-success)";
  if (result === "NOT_ELIGIBLE") return "var(--color-danger)";
  return "var(--color-warning)";
}

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [criteria, setCriteria] = useState<Record<string, Criteria>>({});
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loanAmount, setLoanAmount] = useState(500000);
  const [loanTerm, setLoanTerm] = useState(24);
  const [hasCrbFlag, setHasCrbFlag] = useState<boolean | null>(null);
  const [isSaccoMember, setIsSaccoMember] = useState<boolean | null>(null);
  const [membershipMonths, setMembershipMonths] = useState(0);
  const [isPartOfGroup, setIsPartOfGroup] = useState<boolean | null>(null);
  const [isBusinessOwner, setIsBusinessOwner] = useState<boolean | null>(null);
  const [groupSize, setGroupSize] = useState(0);
  const [hasFincaAccount, setHasFincaAccount] = useState<boolean | null>(null);

  const selectedInstitution = useMemo(
    () => institutions.find((institution) => institution.id === selectedId) ?? null,
    [institutions, selectedId],
  );

  const selectedCriteria = selectedId ? criteria[selectedId] : null;
  const activeBranches = branches.filter((branch) => branch.status === "ACTIVE");
  const activeProducts = products.filter((product) => product.status === "ACTIVE");

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [institutionData, branchData, productData] =
        await Promise.all([
          fetchInstitutions(),
          fetchSaccoBranches(),
          fetchFincaProducts(),
        ]);

      const liveInstitutions = Array.isArray(institutionData) ? institutionData : [];
      setInstitutions(liveInstitutions);
      setBranches(Array.isArray(branchData) ? branchData : []);
      setProducts(Array.isArray(productData) ? productData : []);

      const criteriaEntries = await Promise.all(
        liveInstitutions.map(async (institution: Institution) => {
          try {
            const item = await fetchInstitutionCriteria(Number(institution.id));
            return [institution.id, item] as const;
          } catch {
            return null;
          }
        }),
      );
      setCriteria(
        Object.fromEntries(criteriaEntries.filter(Boolean) as [string, Criteria][]),
      );

      const profileResponse = await fetch("/api/profile", { cache: "no-store" });
      if (profileResponse.ok) {
        const profileJson = await profileResponse.json();
        setProfile(profileJson.profile ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load live institution data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function chooseInstitution(id: string) {
    setSelectedId(id);
    setSelectedBranchId("");
    setSelectedProductId("");
    setResult(null);
  }

  function resetFlow() {
    setStep("select");
    setResult(null);
  }

  function proceedToIntake() {
    if (!selectedInstitution) return;
    setStep("intake");
  }

  async function runCheck() {
    if (!selectedInstitution) return;
    if (selectedInstitution.type === "SACCO_CATEGORY" && !selectedBranchId) {
      setError("Please select your SACCO before checking eligibility.");
      return;
    }
    if (selectedInstitution.type === "MICROFINANCE" && activeProducts.length > 0 && !selectedProductId) {
      setError("Please select a FINCA loan product before checking eligibility.");
      return;
    }

    setChecking(true);
    setError(null);
    try {
      const isSacco = selectedInstitution.type === "SACCO_CATEGORY";
      const employmentCategory =
        isSacco && isSaccoMember
          ? "SACCO_MEMBER"
          : profile?.employmentCategory?.toUpperCase?.() ?? "PRIVATE_SECTOR";
      const userProfile = {
        monthly_net_income:
          profile?.monthlyNetSalary ?? profile?.monthlySalary ?? 0,
        employment_category: employmentCategory,
        length_of_service_months: profile?.employmentYears ?? 0,
        existing_monthly_obligations: profile?.existingLoanAmount ?? 0,
        requested_amount: loanAmount,
        requested_term_months: loanTerm,
        sacco_membership_months: isSacco ? membershipMonths : null,
        has_crb_flag: hasCrbFlag ?? false,
        is_business_owner: selectedInstitution.type === "MICROFINANCE" ? isBusinessOwner : null,
        group_size:
          selectedInstitution.type === "MICROFINANCE"
            ? isPartOfGroup
              ? groupSize
              : 0
            : null,
        has_finca_account: selectedInstitution.type === "MICROFINANCE" ? hasFincaAccount : null,
      };
      const data = await checkEligibility(userProfile, [selectedInstitution.id]);
      setResult(Array.isArray(data) ? data[0] ?? null : null);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eligibility check failed.");
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return <div className={styles.page}>Loading live institution data...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link href="/user/dashboard" className="btn btn-ghost btn-sm" style={{ gap: "8px", marginBottom: "var(--space-md)" }}>
            <ChevronLeft size={16} /> Back
          </Link>
          <h1 className="text-h2">Check Eligibility</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Choose one lender and answer the guided questions before checking.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadAll}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <StepIndicator step={step} />

      {error && (
        <div className="alert alert-danger">
          {error} <button className="btn btn-sm" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {step === "select" && (
        <>
          {institutions.length === 0 ? (
            <div className="card">No institutions are currently available. Please check back soon.</div>
          ) : (
            <div className={styles.institutionGrid}>
              {institutions.map((institution) => (
                <button
                  key={institution.id}
                  type="button"
                  className={`card ${styles.institutionCard} ${
                    selectedId === institution.id ? styles.selected : ""
                  }`}
                  onClick={() => chooseInstitution(institution.id)}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.cardIcon}>
                      {logoFor(institution) ? (
                        <img
                          src={logoFor(institution)}
                          alt={institution.name}
                          className={styles.partnerLogo}
                        />
                      ) : (
                        <Building2 size={22} />
                      )}
                    </div>
                    <span className={styles.checkmark}>
                      <CheckCircle2 size={14} />
                    </span>
                  </div>
                  <div className={styles.cardName}>{institution.name}</div>
                  <div className="badge badge-neutral text-xs">{institution.type}</div>
                  <p className={styles.cardDesc}>{institution.description}</p>
                </button>
              ))}
            </div>
          )}

          <div className={styles.actionRow}>
            <button
              className="btn btn-primary"
              disabled={!selectedInstitution}
              onClick={proceedToIntake}
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {step === "intake" && selectedInstitution && (
        <section className={`card ${styles.intakeCard}`}>
          <div className={styles.intakeTitle}>
            <div className={styles.intakeIcon}>
              {logoFor(selectedInstitution) ? (
                <img
                  src={logoFor(selectedInstitution)}
                  alt={selectedInstitution.name}
                  className={styles.partnerLogo}
                />
              ) : (
                <Building2 size={18} />
              )}
            </div>
            <div>
              <h2 className="text-h3">{selectedInstitution.name}</h2>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Answer these questions for this institution only.
              </p>
            </div>
          </div>

          <div className="grid-2" style={{ gap: "var(--space-lg)" }}>
            <NumberField label="Requested loan amount" value={loanAmount} onChange={setLoanAmount} />
            <NumberField label="Preferred repayment term (months)" value={loanTerm} onChange={setLoanTerm} />

            {selectedInstitution.type === "COMMERCIAL_BANK" && (
              <>
                <AdvisoryBox
                  title="What is CRB?"
                  text="CRB means Credit Reference Bureau. It is a record of how you have handled past loans and repayments. Banks use it to see whether you have unpaid loans, missed payments, or a negative credit flag. A CRB flag does not always mean automatic rejection, but it can make approval harder or require manual review."
                />
                <YesNoField
                  label="Do you currently have a CRB flag or unresolved credit issue?"
                  value={hasCrbFlag}
                  onChange={setHasCrbFlag}
                />
              </>
            )}

            {selectedInstitution.type === "SACCO_CATEGORY" && (
              <>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label" htmlFor="saccoBranch">Which SACCO do you belong to?</label>
                  {activeBranches.length === 0 ? (
                    <div className="alert alert-warning">
                      No SACCOs are currently available. Please check back soon.
                    </div>
                  ) : (
                    <select
                      id="saccoBranch"
                      className="form-select"
                      value={selectedBranchId}
                      onChange={(event) => setSelectedBranchId(event.target.value)}
                    >
                      <option value="">Select your SACCO...</option>
                      {branches.map((branch) => (
                        <option
                          key={branch.id}
                          value={branch.id}
                          disabled={branch.status === "COMING_SOON"}
                        >
                          {branch.branch_name}
                          {branch.status === "COMING_SOON" ? " - Coming Soon" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <YesNoField
                  label="Are you a registered SACCO member?"
                  value={isSaccoMember}
                  onChange={setIsSaccoMember}
                />
                <AdvisoryBox
                  title="Why SACCO membership matters"
                  text="Police SACCO loans are member-based. The app asks this because SACCOs usually require active membership before lending, and newer members may need to wait until they meet the minimum membership period."
                />
                <NumberField
                  label="How many months have you been a member?"
                  value={membershipMonths}
                  onChange={setMembershipMonths}
                />
              </>
            )}

            {selectedInstitution.type === "MICROFINANCE" && (
              <>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Select FINCA loan product</label>
                  {activeProducts.length === 0 ? (
                    <div className="alert alert-warning">
                      No loan products are currently available. Please check back soon.
                    </div>
                  ) : (
                    <div className={styles.productGrid}>
                      {products.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          disabled={product.status === "COMING_SOON"}
                          className={`${styles.productCard} ${
                            selectedProductId === product.id ? styles.selectedProduct : ""
                          }`}
                          onClick={() => setSelectedProductId(product.id)}
                        >
                          <span>{product.product_name}</span>
                          {product.status === "COMING_SOON" && <span>Coming Soon</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <YesNoField
                  label="Are you part of an active business group?"
                  value={isPartOfGroup}
                  onChange={setIsPartOfGroup}
                />
                <AdvisoryBox
                  title="Why FINCA asks about groups"
                  text="FINCA Village Bank Loans are group-based. The group acts as part of the support and guarantee structure, so group size and active participation can affect whether you are ready to apply."
                />
                <YesNoField
                  label="Do you own or actively run a business?"
                  value={isBusinessOwner}
                  onChange={setIsBusinessOwner}
                />
                <NumberField label="If applying as a group, how many members are in the group?" value={groupSize} onChange={setGroupSize} />
                <YesNoField
                  label="Do you have or are you willing to open a FINCA account?"
                  value={hasFincaAccount}
                  onChange={setHasFincaAccount}
                />
                <AdvisoryBox
                  title="What is CRB?"
                  text="CRB means Credit Reference Bureau. FINCA may use a CRB report to review repayment history. A flag can move your result to manual review because the lender may need to understand what caused the credit issue."
                />
                <YesNoField
                  label="Do you currently have a CRB flag or unresolved credit issue?"
                  value={hasCrbFlag}
                  onChange={setHasCrbFlag}
                />
              </>
            )}
          </div>

          <div className={styles.actionRow} style={{ marginTop: "var(--space-lg)" }}>
            <button className="btn btn-ghost" onClick={() => setStep("select")}>
              <ChevronLeft size={16} /> Back
            </button>
            <button className="btn btn-primary" onClick={runCheck} disabled={checking}>
              {checking ? "Checking..." : "Check Eligibility"} <ChevronRight size={16} />
            </button>
          </div>
        </section>
      )}

      {step === "results" && selectedInstitution && (
        <section>
          {result ? (
            <div
              className={`card ${styles.resultCard}`}
              style={{ borderColor: resultColor(result.result) }}
            >
              <div className={styles.resultHeader}>
                <div className={styles.resultIcon}>
                  {logoFor(selectedInstitution) ? (
                    <img
                      src={logoFor(selectedInstitution)}
                      alt={selectedInstitution.name}
                      className={styles.partnerLogoSmall}
                    />
                  ) : (
                    <Building2 size={24} />
                  )}
                </div>
                <div>
                  <div className={styles.resultTitle} style={{ color: resultColor(result.result) }}>
                    {result.result.replaceAll("_", " ")}
                  </div>
                  <div className={styles.resultSubtitle}>{result.institution_name}</div>
                </div>
              </div>
              <p>{result.reason}</p>
              <AdvisoryExplanation
                institution={selectedInstitution}
                result={result}
                criteria={selectedCriteria}
                answers={{
                  hasCrbFlag,
                  isSaccoMember,
                  membershipMonths,
                  isPartOfGroup,
                  isBusinessOwner,
                  groupSize,
                  hasFincaAccount,
                }}
              />
              <div className={styles.profileSummaryBar}>
                <SummaryItem label="Max loan" value={currency(result.max_loan_amount)} />
                <SummaryItem label="Available repayment" value={currency(result.available_monthly_repayment)} />
                <SummaryItem label="Requested amount" value={currency(loanAmount)} />
              </div>
            </div>
          ) : (
            <div className="card">No result returned for this institution.</div>
          )}

          {selectedCriteria && (
            <details className={`card ${styles.compareCard}`} open>
              <summary>Live criteria used for this check</summary>
              <div className="table-wrapper">
                <table className={styles.compareTable}>
                  <tbody>
                    <tr><td>Minimum income</td><td>{currency(selectedCriteria.min_income)}</td></tr>
                    <tr><td>DTI cap</td><td>{selectedCriteria.dti_cap_percent}%</td></tr>
                    <tr><td>CRB check</td><td>{selectedCriteria.crb_check_required ? "Required" : "Not required"}</td></tr>
                    <tr><td>Required documents</td><td>{selectedCriteria.required_documents.join(", ") || "None listed"}</td></tr>
                    <tr><td>Turnaround time</td><td>{selectedCriteria.turnaround_time}</td></tr>
                  </tbody>
                </table>
              </div>
            </details>
          )}

          <div className={styles.actionRow}>
            <button className="btn btn-ghost" onClick={() => setStep("intake")}>
              <ChevronLeft size={16} /> Edit Answers
            </button>
            <button className="btn btn-primary" onClick={resetFlow}>
              Check Another Institution
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const activeIndex = STEPS.indexOf(step);
  return (
    <div className={styles.stepIndicator}>
      {STEPS.map((item, index) => (
        <div key={item} className={styles.step}>
          <span
            className={`${styles.stepDot} ${
              index === activeIndex ? styles.active : index < activeIndex ? styles.done : ""
            }`}
          >
            {index + 1}
          </span>
          <span
            className={`${styles.stepLabel} ${
              index === activeIndex ? styles.active : index < activeIndex ? styles.done : ""
            }`}
          >
            {STEP_LABELS[item]}
          </span>
          {index < STEPS.length - 1 && (
            <span className={`${styles.stepConnector} ${index < activeIndex ? styles.done : ""}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function YesNoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
        <button
          type="button"
          className={`btn ${value === true ? "btn-primary" : "btn-ghost"}`}
          onClick={() => onChange(true)}
        >
          Yes
        </button>
        <button
          type="button"
          className={`btn ${value === false ? "btn-primary" : "btn-ghost"}`}
          onClick={() => onChange(false)}
        >
          No
        </button>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        type="number"
        min={0}
        className="form-input"
        value={value || ""}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function AdvisoryBox({ title, text }: { title: string; text: string }) {
  return (
    <div
      className="alert alert-info"
      style={{
        gridColumn: "1 / -1",
        alignItems: "flex-start",
        lineHeight: 1.6,
      }}
    >
      <div>
        <strong>{title}</strong>
        <div>{text}</div>
      </div>
    </div>
  );
}

function AdvisoryExplanation({
  institution,
  result,
  criteria,
  answers,
}: {
  institution: Institution;
  result: EligibilityResult;
  criteria: Criteria | null;
  answers: {
    hasCrbFlag: boolean | null;
    isSaccoMember: boolean | null;
    membershipMonths: number;
    isPartOfGroup: boolean | null;
    isBusinessOwner: boolean | null;
    groupSize: number;
    hasFincaAccount: boolean | null;
  };
}) {
  const points: string[] = [];

  if (result.result === "LIKELY_ELIGIBLE") {
    points.push(
      "Your profile appears to fit the lender's basic rules, but this is still an advisory result. The lender makes the final decision after document checks.",
    );
  }

  if (result.result === "BORDERLINE") {
    points.push(
      "This is an amber result. It means the application may still proceed, but one or more answers could trigger manual review or extra verification.",
    );
  }

  if (result.result === "NOT_ELIGIBLE") {
    points.push(
      "This is a red result because at least one key lender rule was not met. The reason above shows the first major issue found.",
    );
  }

  if (result.result === "NOT_YET_ELIGIBLE") {
    points.push(
      "This usually means you may qualify later after time-based requirements are met, such as SACCO membership duration.",
    );
  }

  if (institution.type === "COMMERCIAL_BANK") {
    points.push(
      `FDH Bank checks income, existing monthly obligations, repayment capacity, and credit history. CRB is important because it shows repayment behavior from previous loans.`,
    );
    if (answers.hasCrbFlag) {
      points.push(
        "You answered that you have a CRB flag, so the result is treated cautiously. A bank may ask for settlement proof or more information before approval.",
      );
    }
  }

  if (institution.type === "SACCO_CATEGORY") {
    points.push(
      "Police SACCO lending is member-based. Membership status and membership duration are checked before affordability is considered.",
    );
    if (answers.isSaccoMember === false) {
      points.push(
        "You answered that you are not a SACCO member, so the app cannot advise you to proceed with a SACCO loan yet.",
      );
    } else if (answers.membershipMonths > 0 && answers.membershipMonths < 3) {
      points.push(
        "Your membership period is below the usual 3 month minimum, so this is not yet eligible rather than permanently ineligible.",
      );
    }
  }

  if (institution.type === "MICROFINANCE") {
    points.push(
      "FINCA Village Bank Loans are assessed around business activity, group participation, FINCA account readiness, and credit history.",
    );
    if (answers.isPartOfGroup === false || answers.groupSize < 5 || answers.groupSize > 25) {
      points.push(
        "The group requirement matters because Village Bank Loans are designed for groups of 5 to 25 business owners.",
      );
    }
    if (answers.isBusinessOwner === false) {
      points.push(
        "You answered that you do not actively own or run a business, which conflicts with this product's target borrower profile.",
      );
    }
    if (answers.hasFincaAccount === false) {
      points.push(
        "FINCA repayments are normally handled through a FINCA account, so not having or not being willing to open one blocks this product.",
      );
    }
  }

  if (criteria) {
    points.push(
      `The live criteria used include a minimum income of ${currency(criteria.min_income)} and a DTI cap of ${criteria.dti_cap_percent}%.`,
    );
  }

  return (
    <div className="alert alert-info" style={{ marginTop: "var(--space-md)", lineHeight: 1.65 }}>
      <div>
        <strong>Why this result?</strong>
        <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem" }}>
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summaryItem}>
      <div className={styles.summaryValue}>{value}</div>
      <div className={styles.summaryLabel}>{label}</div>
    </div>
  );
}
