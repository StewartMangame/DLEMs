"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { INSTITUTIONS } from "@/lib/institutions";
import { runSaccoEligibility, calcLoanBreakdown } from "@/lib/institutions/saccoEligibilityEngine";
import { runBankEligibility } from "@/lib/institutions/bankEligibilityEngine";
import { runFincaEligibility } from "@/lib/institutions/fincaEligibilityEngine";
import { useLanguage } from "@/lib/LanguageContext";
import type {
  InstitutionConfig,
  SaccoIntakeData,
  BankIntakeData,
  FincaIntakeData,
  EligibilityResult,
  LoanTypeConfig,
  EmploymentCategory,
} from "@/lib/institutions/types";

// ─── Step IDs ──────────────────────────────────────────────────────────────────
type Step = "select" | "intake" | "results";

// ─── Helpers ────────────────────────────────────────────────────────────────────
const STEP_LABELS: Record<Step, { en: string; ny: string }> = {
  select : { en: "Select Institution",  ny: "Sankhani Malo"    },
  intake : { en: "Additional Details",  ny: "Zambiri Zowonjeza" },
  results: { en: "Eligibility Results", ny: "Zotsatira"        },
};
const STEPS: Step[] = ["select", "intake", "results"];

function mwk(n: number) {
  return `MWK ${Math.round(n).toLocaleString()}`;
}

// ─── Profile shape returned by /api/profile ────────────────────────────────────
interface UserProfile {
  monthlySalary?: number;
  monthlyNetSalary?: number;
  employmentCategory?: string;
  employmentYears?: number;
  existingLoanAmount?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════════════════════
export default function InstitutionsPage() {
  const { language } = useLanguage();
  const ny = language === "ny";

  // ── Remote state ─────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("select");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ── SACCO intake ─────────────────────────────────────────────────────────────
  const [saccoIntake, setSaccoIntake] = useState<SaccoIntakeData>({
    isSaccoMember: false,
    saccoMembershipMonths: 0,
    saccoName: "",
  });

  // ── Bank (CRB) intake ────────────────────────────────────────────────────────
  const [bankIntake, setBankIntake] = useState<BankIntakeData>({
    hasCrbFlag: null,
  });

  // ── Finca intake ─────────────────────────────────────────────────────────────
  const [fincaIntake, setFincaIntake] = useState<FincaIntakeData>({
    isPartOfGroup: null,
    groupSize: 0,
    ownsBusiness: null,
    hasFincaAccount: null,
  });

  // ── Selected products (for institutions that require product selection) ──────
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string>>({});

  // ── Results ──────────────────────────────────────────────────────────────────
  const [results, setResults] = useState<EligibilityResult[]>([]);

  // ── Calculator ───────────────────────────────────────────────────────────────
  const [calcState, setCalcState] = useState<Record<string, {
    loanType: LoanTypeConfig | null;
    rate: number;
    term: number;
  }>>({});

  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) setProfile(d.profile);
        setProfileLoading(false);
      })
      .catch(() => setProfileLoading(false));
  }, []);

  // ── Derived profile values ────────────────────────────────────────────────────
  const monthlyIncome       = profile?.monthlySalary ?? profile?.monthlyNetSalary ?? 0;
  const serviceMonths       = profile?.employmentYears ?? 0;  // stored as months
  const existingObligations = profile?.existingLoanAmount ?? 0;
  const employmentCategory  = (profile?.employmentCategory ?? "private_sector") as EmploymentCategory;

  // ── Derived institution sets from selection ───────────────────────────────────
  const displayCards = useMemo(() => {
    const cards: InstitutionConfig[] = [];
    const saccoInsts = INSTITUTIONS.filter(i => i.type === "SACCO");
    
    if (saccoInsts.length > 0) {
      cards.push({
        id: "sacco-group",
        name: "SACCO",
        type: "SACCO",
        description: "Select this if you are a member of a SACCO. You will be asked to choose your specific SACCO from a list.",
        membershipRequired: true,
        crbCheckRequired: false,
        requiresProductSelection: false,
        requiresGroupLending: false,
        minimumMembershipMonths: 0,
        turnaroundDays: "Varies",
        comparisonFields: {
          minimumLoanMWK: 0,
          maximumLoanMWK: 0,
        }
      } as any);
    }
    cards.push(...INSTITUTIONS.filter(i => i.type !== "SACCO"));
    return cards;
  }, []);

  const selectedDisplayCards = useMemo(
    () => displayCards.filter(i => selectedIds.includes(i.id)),
    [selectedIds, displayCards]
  );

  const selectedInstitutions = useMemo(() => {
    const insts = INSTITUTIONS.filter(i => selectedIds.includes(i.id) && i.type !== "SACCO");
    if (selectedIds.includes("sacco-group") && saccoIntake.saccoName) {
      const selectedSacco = INSTITUTIONS.find(i => i.id === saccoIntake.saccoName);
      if (selectedSacco) insts.push(selectedSacco);
    }
    return insts;
  }, [selectedIds, saccoIntake.saccoName]);

  const hasSaccoInstitution = useMemo(
    () => selectedDisplayCards.some(i => i.type === "SACCO" || i.membershipRequired),
    [selectedDisplayCards]
  );
  const hasBankInstitution = useMemo(
    () => selectedDisplayCards.some(i => i.crbCheckRequired),
    [selectedDisplayCards]
  );
  const hasFincaInstitution = useMemo(
    () => selectedDisplayCards.some(i => i.requiresGroupLending),
    [selectedDisplayCards]
  );
  const needsIntakeStep = hasSaccoInstitution || hasBankInstitution || hasFincaInstitution;

  // ─────────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────────
  function toggleInstitution(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function handleProceedFromSelect() {
    if (selectedIds.length === 0) return;
    
    // Validate that institutions requiring product selection have a product selected
    const unselectedProductInsts = selectedDisplayCards.filter(
      inst => inst.requiresProductSelection && !selectedProducts[inst.id]
    );
    if (unselectedProductInsts.length > 0) {
      alert(ny ? "Chonde sankhani mtundu wa ngongole woyamba" : "Please select a loan product for all expanded institutions.");
      return;
    }

    if (needsIntakeStep) {
      setStep("intake");
    } else {
      runEligibility();
      setStep("results");
    }
  }

  function runEligibility() {
    const newResults: EligibilityResult[] = selectedInstitutions.map(inst => {
      if (inst.requiresGroupLending) {
        return runFincaEligibility(inst, {
          employmentCategory,
          monthlyNetIncome: monthlyIncome,
          serviceMonths,
          existingMonthlyObligations: existingObligations,
          finca: fincaIntake,
          bank: bankIntake,
        });
      }
      if (inst.type === "Commercial Bank") {
        return runBankEligibility(inst, {
          employmentCategory,
          monthlyNetIncome: monthlyIncome,
          serviceMonths,
          existingMonthlyObligations: existingObligations,
          bank: bankIntake,
        });
      }
      // SACCO and any other types — use SACCO engine
      return runSaccoEligibility(inst, {
        employmentCategory,
        monthlyNetIncome: monthlyIncome,
        serviceMonths,
        existingMonthlyObligations: existingObligations,
        sacco: saccoIntake,
      });
    });
    setResults(newResults);

    // Initialise calculator for each eligible or borderline institution
    const init: typeof calcState = {};
    newResults.forEach(r => {
      if (r.status === "likely_eligible" || r.status === "borderline") {
        const defaultTerm = r.institution.defaultRepaymentTermMonths
          ?? r.institution.repaymentTermsMonths[0]
          ?? 12;
        // If institution requires product selection, only select the chosen product
        let matchedLoanType = r.institution.loanTypes[0] ?? null;
        if (r.institution.requiresProductSelection && selectedProducts[r.institution.id]) {
          matchedLoanType = r.institution.loanTypes.find(lt => lt.key === selectedProducts[r.institution.id]) ?? matchedLoanType;
        }

        init[r.institution.id] = {
          loanType: matchedLoanType,
          rate: r.institution.fixedInterestRate ?? 24,
          term: defaultTerm,
        };
      }
    });
    setCalcState(init);
  }

  function handleProceedFromIntake() {
    runEligibility();
    setStep("results");
  }

  function reset() {
    setStep("select");
    setSelectedIds([]);
    setResults([]);
    setSaccoIntake({ isSaccoMember: false, saccoMembershipMonths: 0, saccoName: "" });
    setBankIntake({ hasCrbFlag: null });
    setFincaIntake({ isPartOfGroup: null, groupSize: 0, ownsBusiness: null, hasFincaAccount: null });
    setSelectedProducts({});
  }

  // ─────────────────────────────────────────────────────────────────────────────
  const profileComplete = !!(profile && monthlyIncome > 0 && profile.employmentCategory);
  const stepIdx = STEPS.indexOf(step);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className="text-h2">
          {ny ? "Kuyang'anira Mwayi wa Ngongole" : "Institution Eligibility Check"}
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)", marginTop: 4 }}>
          {ny
            ? "Sankhani malo omwe mukufuna kuyang'anira kuti mukuyenera ngongole kapena ai."
            : "Select institutions to check your loan eligibility and compare terms side-by-side."}
        </p>
      </div>

      {/* ── Profile warning ──────────────────────────────────────────────────── */}
      {!profileLoading && !profileComplete && (
        <div className="alert alert-warning">
          <span>⚠</span>
          <div>
            <strong>{ny ? "Uzani mbiri yanu choyamba" : "Complete your financial profile first."}</strong>{" "}
            {ny
              ? "Kumbukirani kutha mbiri yanu yachuma kuti muthe kuyang'anira ngongole."
              : "Your profile is needed to run eligibility checks."}{" "}
            <Link href="/user/dashboard/profile">{ny ? "Konzani mbiri →" : "Set up profile →"}</Link>
          </div>
        </div>
      )}

      {/* ── Step progress indicator ──────────────────────────────────────────── */}
      {profileComplete && (
        <div className={styles.stepIndicator}>
          {STEPS.map((s, i) => {
            const isDone   = i < stepIdx;
            const isActive = i === stepIdx;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "0 0 auto" }}>
                <div className={styles.step}>
                  <div className={`${styles.stepDot} ${isActive ? styles.active : ""} ${isDone ? styles.done : ""}`}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  <span className={`${styles.stepLabel} ${isActive ? styles.active : ""} ${isDone ? styles.done : ""}`}>
                    {ny ? STEP_LABELS[s].ny : STEP_LABELS[s].en}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`${styles.stepConnector} ${isDone ? styles.done : ""}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* STEP 1 — Institution selection                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {step === "select" && profileComplete && (
        <div>
          <h2 className="text-h3" style={{ marginBottom: "var(--space-md)" }}>
            {ny ? "Sankhani malo omwe mukufuna" : "Choose institutions to check"}
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-lg)" }}>
            {ny
              ? "Sankhani malo omwe mukufuna kuyang'anira. Mutha kusankha malo ambiri."
              : "Select one or more institutions. You can check multiple at once."}
          </p>

          <div className={styles.institutionGrid}>
            {displayCards.map(inst => (
              <InstitutionCard
                key={inst.id}
                institution={inst}
                selected={selectedIds.includes(inst.id)}
                selectedProductId={selectedProducts[inst.id]}
                onToggle={() => toggleInstitution(inst.id)}
                onSelectProduct={(productId) => setSelectedProducts(p => ({ ...p, [inst.id]: productId }))}
                ny={ny}
              />
            ))}
          </div>

          <div className={styles.actionRow} style={{ marginTop: "var(--space-xl)" }}>
            <button
              className="btn btn-primary btn-lg"
              disabled={selectedIds.length === 0}
              onClick={handleProceedFromSelect}
            >
              {ny ? "Pita →" : `Check Eligibility for ${selectedIds.length} institution${selectedIds.length !== 1 ? "s" : ""} →`}
            </button>
            {selectedIds.length === 0 && (
              <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {ny ? "Sankhani malo oyamba" : "Select at least one institution to continue"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* STEP 2 — Additional intake form (SACCO + Bank combined)              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {step === "intake" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
          {/* SACCO details — only if at least one SACCO is selected */}
          {hasSaccoInstitution && (
            <SaccoIntakeForm
              intake={saccoIntake}
              onChange={setSaccoIntake}
              ny={ny}
            />
          )}

          {/* CRB declaration — only if at least one commercial bank or FINCA is selected */}
          {hasBankInstitution && (
            <BankIntakeForm
              intake={bankIntake}
              onChange={setBankIntake}
              ny={ny}
            />
          )}

          {/* FINCA-specific intake */}
          {hasFincaInstitution && (
            <FincaIntakeForm
              intake={fincaIntake}
              onChange={setFincaIntake}
              ny={ny}
            />
          )}

          <div className={styles.actionRow}>
            <button className="btn btn-ghost" onClick={() => setStep("select")}>
              ← {ny ? "Bwererani" : "Back"}
            </button>
            <button
              className="btn btn-primary btn-lg"
              disabled={
                (hasSaccoInstitution && (!saccoIntake.isSaccoMember || saccoIntake.saccoMembershipMonths <= 0 || saccoIntake.saccoName.trim() === "")) ||
                (hasBankInstitution && bankIntake.hasCrbFlag === null) ||
                (hasFincaInstitution && (fincaIntake.isPartOfGroup === null || (fincaIntake.isPartOfGroup && (fincaIntake.groupSize < 5 || fincaIntake.groupSize > 25)) || fincaIntake.ownsBusiness === null || fincaIntake.hasFincaAccount === null))
              }
              onClick={handleProceedFromIntake}
            >
              {ny ? "Yang'anani Mwayi →" : "Run Eligibility Check →"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* STEP 3 — Results                                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {step === "results" && results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
          {results.map(result => (
            <div key={result.institution.id}>
              <EligibilityResultCard
                result={result}
                ny={ny}
              />

              {/* Calculator — only for eligible or borderline results */}
              {(result.status === "likely_eligible" || result.status === "borderline") && calcState[result.institution.id] && (
                <RepaymentCalculator
                  result={result}
                  state={calcState[result.institution.id]}
                  onChange={patch =>
                    setCalcState(prev => ({
                      ...prev,
                      [result.institution.id]: { ...prev[result.institution.id], ...patch },
                    }))
                  }
                  ny={ny}
                />
              )}

              {/* Comparison table */}
              <ComparisonTable
                institution={result.institution}
                selectedProductId={selectedProducts[result.institution.id]}
                ny={ny}
              />
            </div>
          ))}

          <div className={styles.actionRow} style={{ marginTop: "var(--space-md)" }}>
            <button className="btn btn-ghost" onClick={reset}>
              ← {ny ? "Bwererani kumayambiriro" : "Start over"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component: Institution card
// ═══════════════════════════════════════════════════════════════════════════════
function InstitutionCard({
  institution, selected, selectedProductId, onToggle, onSelectProduct, ny,
}: {
  institution: InstitutionConfig;
  selected: boolean;
  selectedProductId?: string;
  onToggle: () => void;
  onSelectProduct?: (productId: string) => void;
  ny: boolean;
}) {
  const typeIcon = institution.type === "SACCO" ? "🤝" : "🏦";

  return (
    <div
      role="button"
      tabIndex={0}
      className={`card ${styles.institutionCard} ${selected ? styles.selected : ""}`}
      style={{ cursor: selected && institution.requiresProductSelection ? "default" : "pointer" }}
      onClick={onToggle}
      onKeyDown={e => e.key === "Enter" && onToggle()}
      aria-pressed={selected}
      aria-label={`Select ${institution.name}`}
    >
      <div>
        <div className={styles.cardTop}>
        <div className={styles.cardIcon}>
          {institution.logoUrl ? (
            <img src={institution.logoUrl} alt={institution.name} className={styles.partnerLogo} />
          ) : (
            typeIcon
          )}
        </div>
        <div className={`${styles.checkmark} ${selected ? styles.selected : ""}`}>✓</div>
      </div>

      <div className={styles.cardName}>{institution.name}</div>

      <div className={styles.cardMeta}>
        <span className="badge badge-info">{institution.type}</span>
        {institution.membershipRequired && (
          <span className="badge badge-warning">
            {ny ? "Membala chokha" : "Members only"}
          </span>
        )}
        {institution.crbCheckRequired && (
          <span className="badge badge-secondary">
            {ny ? "CRB Imasungidwa" : "CRB Required"}
          </span>
        )}
      </div>

      <p className={styles.cardDesc}>{institution.description}</p>

      <div style={{ marginTop: "var(--space-md)", fontSize: "0.8rem", color: "var(--color-text-muted)", pointerEvents: "none" }}>
        {institution.minimumMembershipMonths > 0 && (
          <div>📅 {ny ? "Unansi wofunikira:" : "Min. membership:"} {institution.minimumMembershipMonths} {ny ? "miyezi" : "months"}</div>
        )}
        <div style={{ marginTop: institution.minimumMembershipMonths > 0 ? 4 : 0 }}>
          ⏱ {ny ? "Nthawi yotsatira:" : "Turnaround:"} {institution.turnaroundDays}
        </div>
        {institution.id === "sacco-group" ? (
          <div style={{ marginTop: 4 }}>
            💰 {ny ? "Ngongole:" : "Loan:"} {ny ? "Zimatengera SACCO" : "Varies by SACCO"}
          </div>
        ) : (
          <div style={{ marginTop: 4 }}>
            💰 {ny ? "Ngongole:" : "Loan:"} {mwk(institution.comparisonFields.minimumLoanMWK)} – {mwk(institution.comparisonFields.maximumLoanMWK)}
          </div>
        )}
      </div>
      </div>

      {selected && institution.requiresProductSelection && (
        <div 
          className={styles.productSelectionContainer}
          onClick={e => e.stopPropagation()} // Prevent card toggle when clicking inside
        >
          <h4 className="text-sm" style={{ fontWeight: 600, marginBottom: "var(--space-sm)", color: "var(--color-text-primary)" }}>
            {ny ? "Sankhani Mtundu wa Ngongole" : "Select Loan Product"}
          </h4>
          <div className={styles.productGrid}>
            {institution.loanTypes.map(lt => (
              <div 
                key={lt.key} 
                className={`${styles.productCard} ${selectedProductId === lt.key ? styles.selectedProduct : ''}`} 
                onClick={() => onSelectProduct && onSelectProduct(lt.key)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && onSelectProduct && onSelectProduct(lt.key)}
              >
                <div className={styles.productCardLabel}>{ny ? lt.labelNy : lt.label}</div>
              </div>
            ))}
            <div className={styles.productCardComingSoon}>
              {ny ? "Zambiri zikubwera..." : "More products coming soon..."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component: SACCO intake form (shown only when SACCO institution selected)
// ═══════════════════════════════════════════════════════════════════════════════
function SaccoIntakeForm({
  intake, onChange, ny,
}: {
  intake: SaccoIntakeData;
  onChange: (d: SaccoIntakeData) => void;
  ny: boolean;
}) {
  return (
    <div className={`card ${styles.intakeCard}`}>
      <div className={styles.intakeTitle}>
        <div className={styles.intakeIcon}>🤝</div>
        <div>
          <h2 className="text-h3">{ny ? "Zambiri za SACCO Yanu" : "Your SACCO Membership Details"}</h2>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {ny
              ? "Izi zimagwiritsidwa ntchito kuyesa ngati mukuyenera ngongole ku SACCO."
              : "This information is used to verify your SACCO membership eligibility."}
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ gap: "var(--space-lg)" }}>
        {/* Are you a SACCO member? */}
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label className="form-label">
            {ny ? "Kodi ndinu membala wa SACCO?" : "Are you a registered SACCO member?"}
          </label>
          <div style={{ display: "flex", gap: "var(--space-md)", marginTop: "var(--space-sm)" }}>
            {[true, false].map(val => (
              <label
                key={String(val)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                  cursor: "pointer",
                  padding: "10px 18px",
                  borderRadius: "var(--radius-md)",
                  border: `1.5px solid ${intake.isSaccoMember === val ? "var(--color-primary)" : "var(--color-border)"}`,
                  background: intake.isSaccoMember === val ? "var(--color-primary-glow)" : "transparent",
                  transition: "all var(--transition-fast)",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                }}
              >
                <input
                  type="radio"
                  name="isSaccoMember"
                  checked={intake.isSaccoMember === val}
                  onChange={() => onChange({ ...intake, isSaccoMember: val })}
                  style={{ display: "none" }}
                />
                {val
                  ? (ny ? "Inde, ndine membala" : "Yes, I am a member")
                  : (ny ? "Ayi, sindine membala" : "No, I am not a member")}
              </label>
            ))}
          </div>
          {!intake.isSaccoMember && (
            <div className="alert alert-warning" style={{ marginTop: "var(--space-md)" }}>
              ⚠ {ny
                ? "Ngati simuli membala wa SACCO, simutha kulowera malowo."
                : "If you are not a SACCO member, you will not qualify for SACCO institutions."}
            </div>
          )}
        </div>

        {/* SACCO name */}
        <div className="form-group">
          <label className="form-label" htmlFor="saccoName">
            {ny ? "Dzina la SACCO yanu" : "Which SACCO do you belong to?"}
          </label>
          <select
            id="saccoName"
            className="form-select"
            value={intake.saccoName}
            onChange={e => onChange({ ...intake, saccoName: e.target.value })}
          >
            <option value="">{ny ? "Sankhani SACCO yanu..." : "Select your SACCO..."}</option>
            {INSTITUTIONS.filter(i => i.type === "SACCO").map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div className="form-help" style={{ marginTop: "8px" }}>
            {ny ? "Simukuwona SACCO yanu? SACCO zina ziwonjezedwa posachedwa." : "Don't see your SACCO? More SACCOs will be added soon."}
          </div>
        </div>

        {/* Membership duration */}
        <div className="form-group">
          <label className="form-label" htmlFor="saccoMonths">
            {ny ? "Nthawi ya unansi (miyezi)" : "How long have you been a member? (months)"}
          </label>
          <input
            id="saccoMonths"
            type="number"
            min={0}
            className="form-input"
            placeholder={ny ? "mwachitsanzo: 6" : "e.g. 6"}
            value={intake.saccoMembershipMonths || ""}
            onChange={e => onChange({ ...intake, saccoMembershipMonths: parseInt(e.target.value) || 0 })}
          />
          <div className="form-help">
            {ny
              ? "Malawi Police SACCO imafuna miyezi 3 yotsatira."
              : "Malawi Police SACCO requires a minimum of 3 months membership."}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component: Bank CRB intake form (shown only when commercial bank selected)
// ═══════════════════════════════════════════════════════════════════════════════
function BankIntakeForm({
  intake, onChange, ny,
}: {
  intake: BankIntakeData;
  onChange: (d: BankIntakeData) => void;
  ny: boolean;
}) {
  return (
    <div className={`card ${styles.intakeCard}`}>
      <div className={styles.intakeTitle}>
        <div className={styles.intakeIcon}>🏦</div>
        <div>
          <h2 className="text-h3">{ny ? "Nkhani ya CRB" : "Credit Reference Bureau (CRB) Declaration"}</h2>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {ny
              ? "Mabanki amawona zolemba za CRB nthawi yonse isanapereke ngongole. Tikufuna kuzindikira zomwe muna ndi zolemba za CRB."
              : "Commercial banks always check CRB records before approving loans. We need to understand your current CRB status."}
          </p>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: "var(--space-md)" }}>
        <label className="form-label">
          {ny
            ? "Kodi muli ndi zolemba za CRB kapena ngongole yomwe simunapalitse?"
            : "Do you have any outstanding CRB flags or defaulted loans on record?"}
        </label>
        <div className="form-help" style={{ marginBottom: "var(--space-md)" }}>
          {ny
            ? "Yankha mwachowona. Banki idzaona zolemba izi nthawi yoloweza ngongole."
            : "Answer honestly. The bank will verify this during your application regardless."}
        </div>
        <div style={{ display: "flex", gap: "var(--space-md)" }}>
          {([false, true] as const).map(val => (
            <label
              key={String(val)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                cursor: "pointer",
                padding: "10px 18px",
                borderRadius: "var(--radius-md)",
                border: `1.5px solid ${intake.hasCrbFlag === val
                  ? val ? "var(--color-danger)" : "var(--color-success)"
                  : "var(--color-border)"}`,
                background: intake.hasCrbFlag === val
                  ? val ? "rgba(255,59,92,0.1)" : "rgba(0,200,150,0.1)"
                  : "transparent",
                transition: "all var(--transition-fast)",
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              <input
                type="radio"
                name="hasCrbFlag"
                checked={intake.hasCrbFlag === val}
                onChange={() => onChange({ hasCrbFlag: val })}
                style={{ display: "none" }}
              />
              {val
                ? (ny ? "Inde, ndili ndi zolemba" : "Yes, I have a CRB flag")
                : (ny ? "Ayi, palibe zolemba" : "No, I have no CRB flags")}
            </label>
          ))}
        </div>

        {intake.hasCrbFlag === true && (
          <div className="alert alert-warning" style={{ marginTop: "var(--space-md)" }}>
            ⚠ {ny
              ? "Zolemba za CRB zimatha kukhudza pangano lanu. Titha kupitirizabe kuyang'anira mwayi wanu."
              : "A CRB flag may affect your application. We will still calculate your eligibility — the bank makes the final decision."}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component: Eligibility result card
// ═══════════════════════════════════════════════════════════════════════════════
function EligibilityResultCard({
  result, ny,
}: {
  result: EligibilityResult;
  ny: boolean;
}) {
  const {
    status, institution, failedRule, failedRuleNy,
    loanTypeResults, profileSummary, civilServantNote, civilServantNoteNy,
  } = result;

  const statusMeta = {
    likely_eligible: {
      icon: "✅",
      title: ny ? "Mungayenera Ngongole" : "Likely Eligible",
      subtitle: ny
        ? "Muli ndi mwayi wopeza ngongole ku malo akuno."
        : "You appear to meet the eligibility criteria for this institution.",
      cls: styles.eligible,
      alertCls: "alert-success",
      alertIcon: "✓",
    },
    borderline: {
      icon: "⚠️",
      title: ny ? "Mungayenera — Zobwezera CRB" : "Borderline — CRB Flag Declared",
      subtitle: ny
        ? "Mungayenera ngongole koma zolemba za CRB zingateteze pangano lanu."
        : "You may qualify, but your declared CRB flag may affect your application.",
      cls: styles.notYet,
      alertCls: "alert-warning",
      alertIcon: "⚠",
    },
    not_yet_eligible: {
      icon: "⏳",
      title: ny ? "Simunafikire Nthawi" : "Not Yet Eligible",
      subtitle: ny
        ? "Simunafikire zofunikira zonse koma mutha kubwereza mutsogolo."
        : "You do not yet meet all criteria, but you may qualify in the future.",
      cls: styles.notYet,
      alertCls: "alert-warning",
      alertIcon: "⏳",
    },
    not_eligible: {
      icon: "❌",
      title: ny ? "Simuyenera" : "Not Eligible",
      subtitle: ny
        ? "Simukukwaniritsa zofunikira za malo akuno."
        : "You do not meet the eligibility requirements for this institution.",
      cls: styles.notEligible,
      alertCls: "alert-danger",
      alertIcon: "✗",
    },
  }[status];

  const badgeCls = {
    likely_eligible: "badge-success",
    borderline:      "badge-warning",
    not_yet_eligible:"badge-warning",
    not_eligible:    "badge-danger",
  }[status];

  return (
    <div className={`card ${styles.resultCard} ${statusMeta.cls}`} style={{ marginBottom: "var(--space-lg)" }}>
      {/* Header */}
      <div className={styles.resultHeader}>
        <div className={`${styles.resultIcon} ${statusMeta.cls}`}>
          {institution.logoUrl ? (
            <img src={institution.logoUrl} alt={institution.name} className={styles.partnerLogoSmall} />
          ) : (
            statusMeta.icon
          )}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flexWrap: "wrap" }}>
            <span className={`${styles.resultTitle} ${statusMeta.cls}`}>{statusMeta.title}</span>
            <span className={`badge ${badgeCls}`}>{institution.name}</span>
          </div>
          <div className={styles.resultSubtitle}>{statusMeta.subtitle}</div>
        </div>
      </div>

      {/* Profile summary bar */}
      <div className={styles.profileSummaryBar}>
        <div className={styles.summaryItem}>
          <div className={styles.summaryValue}>{mwk(profileSummary.monthlyIncome)}</div>
          <div className={styles.summaryLabel}>{ny ? "Malipiro Apamwezi" : "Monthly Income"}</div>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.summaryValue}>{mwk(profileSummary.existingObligations)}</div>
          <div className={styles.summaryLabel}>{ny ? "Ngongole Zilipo" : "Existing Obligations"}</div>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.summaryValue}>{mwk(profileSummary.availableRepayment)}</div>
          <div className={styles.summaryLabel}>{ny ? "Malo Otsala" : "Available Repayment"}</div>
        </div>
      </div>

      {/* Failure / borderline reason */}
      {(status !== "likely_eligible") && (failedRule || failedRuleNy) && (
        <div
          className={`alert ${statusMeta.alertCls}`}
          style={{ marginTop: "var(--space-md)" }}
        >
          <span>{statusMeta.alertIcon}</span>
          <div>
            <strong>{ny ? "Chifukwa:" : "Reason:"}</strong>{" "}
            {ny ? (failedRuleNy ?? failedRule) : failedRule}
          </div>
        </div>
      )}

      {/* Civil servant informational note */}
      {(civilServantNote || civilServantNoteNy) && (
        <div className="alert alert-info" style={{ marginTop: "var(--space-md)" }}>
          <span>🏛</span>
          <div>
            <strong>{ny ? "Cholinga cha Ogwira Ntchito Boma:" : "Civil Servant Note:"}</strong>{" "}
            {ny ? (civilServantNoteNy ?? civilServantNote) : civilServantNote}
          </div>
        </div>
      )}

      {/* Loan type breakdown (eligible and borderline) */}
      {(status === "likely_eligible" || status === "borderline") && loanTypeResults && (
        <div>
          <h3 className="text-h3" style={{ margin: "var(--space-lg) 0 var(--space-sm)" }}>
            {ny ? "Mtundu wa Ngongole — Ndalama Zapadera" : "Loan Type Maximum Amounts"}
          </h3>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-md)" }}>
            {ny
              ? "Izi ndi ndalama zapadera zomwe mungalandire pazinthu zosiyanasiyana."
              : "These are your estimated maximum loan amounts by loan type, based on your repayment capacity."}
          </p>
          <div className={styles.loanTypeGrid}>
            {loanTypeResults.map(lt => (
              <div key={lt.loanType.key} className={styles.loanTypeItem}>
                <div className={styles.loanTypeName}>
                  {ny ? lt.loanType.labelNy : lt.loanType.label}
                </div>
                <div className={styles.loanTypeAmount}>{mwk(lt.maxAffordableMWK)}</div>
                <div className={styles.loanTypeCap}>
                  {lt.cappedAtMax
                    ? (ny ? `Malire: ${mwk(lt.loanType.maxAmountMWK)}` : `Capped at max: ${mwk(lt.loanType.maxAmountMWK)}`)
                    : (ny ? `Malire: ${mwk(lt.loanType.maxAmountMWK)}` : `Type max: ${mwk(lt.loanType.maxAmountMWK)}`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component: Repayment calculator
// ═══════════════════════════════════════════════════════════════════════════════
function RepaymentCalculator({
  result, state, onChange, ny,
}: {
  result: EligibilityResult;
  state: { loanType: LoanTypeConfig | null; rate: number; term: number };
  onChange: (patch: Partial<{ loanType: LoanTypeConfig; rate: number; term: number }>) => void;
  ny: boolean;
}) {
  const { institution, loanTypeResults, profileSummary } = result;

  // Selected loan type config
  const selectedLt = state.loanType ?? institution.loanTypes[0];
  const ltResult = loanTypeResults?.find(lt => lt.loanType.key === selectedLt?.key);
  const maxPrincipal = ltResult?.maxAffordableMWK ?? selectedLt?.maxAmountMWK ?? 0;

  // Calculator output
  const breakdown = useMemo(() => {
    if (!state.rate || !state.term || maxPrincipal <= 0) return null;
    return calcLoanBreakdown(maxPrincipal, state.rate, state.term);
  }, [maxPrincipal, state.rate, state.term]);

  return (
    <div className={`card ${styles.calcCard}`} style={{ marginBottom: "var(--space-lg)" }}>
      <h3 className="text-h3" style={{ marginBottom: "var(--space-xs)" }}>
        🧮 {ny ? "Kasoti ya Malipiro" : "Repayment Calculator"}
      </h3>
      <p className="text-sm" style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-lg)" }}>
        {ny
          ? "Sankhani mtundu wa ngongole, cholinga cha faida, ndi nthawi yolipira."
          : "Select a loan type, enter the interest rate offered by the institution, and choose a repayment term."}
      </p>

      {/* Loan type selector */}
      <div className="form-group" style={{ marginBottom: "var(--space-lg)" }}>
        <label className="form-label">{ny ? "Mtundu wa Ngongole" : "Loan Type"}</label>
        <select
          className="form-select"
          value={selectedLt?.key ?? ""}
          onChange={e => {
            const lt = institution.loanTypes.find(l => l.key === e.target.value) ?? null;
            if (lt) onChange({ loanType: lt });
          }}
        >
          {institution.loanTypes.map(lt => (
            <option key={lt.key} value={lt.key}>
              {ny ? lt.labelNy : lt.label} — max {mwk(lt.maxAmountMWK)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.calcGrid}>
        {/* Interest rate */}
        <div className="form-group">
          <label className="form-label" htmlFor={`rate-${institution.id}`}>
            {ny ? "Faida ya Padzaka (% pa annum)" : "Interest Rate (% per annum)"}
          </label>
          <input
            id={`rate-${institution.id}`}
            type="number"
            min={1}
            max={100}
            step={0.5}
            className="form-input"
            placeholder="e.g. 24"
            value={state.rate || ""}
            onChange={e => onChange({ rate: parseFloat(e.target.value) || 0 })}
            disabled={institution.fixedInterestRate !== undefined}
          />
          <div className="form-help">
            {institution.fixedInterestRate !== undefined
              ? (ny ? "Malo ano ali ndi faida yosasintha." : "This institution has a fixed interest rate.")
              : (ny
                ? "Lowetsani faida imene malo akudziwa. Muza funsira ku malo."
                : "Enter the annual interest rate quoted by the institution. Ask the institution directly for their current rate.")}
          </div>
        </div>

        {/* Repayment term */}
        <div className="form-group">
          <label className="form-label">{ny ? "Nthawi Yolipira (miyezi)" : "Repayment Term (months)"}</label>
          <div className={styles.termSelector}>
            {institution.repaymentTermsMonths.map(t => (
              <button
                key={t}
                type="button"
                className={`${styles.termBtn} ${state.term === t ? styles.selected : ""}`}
                onClick={() => onChange({ term: t })}
              >
                {t}m
              </button>
            ))}
          </div>
          <div className="form-help">
            {ny ? "Sankhani nthawi yolipira" : "Select your preferred repayment period"}
          </div>
        </div>
      </div>

      {/* Results */}
      {breakdown && state.rate > 0 && (
        <>
          <div className={styles.calcResults}>
            <div className={styles.calcResultItem}>
              <div className={styles.calcResultValue}>{mwk(maxPrincipal)}</div>
              <div className={styles.calcResultLabel}>{ny ? "Ngongole Yapadera" : "Max Loan Amount"}</div>
            </div>
            <div className={styles.calcResultItem}>
              <div className={styles.calcResultValue}>{mwk(breakdown.monthlyRepayment)}</div>
              <div className={styles.calcResultLabel}>{ny ? "Malipiro Apamwezi" : "Est. Monthly Repayment"}</div>
            </div>
            <div className={styles.calcResultItem}>
              <div className={styles.calcResultValue}>{mwk(breakdown.totalRepayment)}</div>
              <div className={styles.calcResultLabel}>{ny ? "Ndalama Zonse Zolipira" : "Total Repayment"}</div>
            </div>
            <div className={styles.calcResultItem}>
              <div className={styles.calcResultValue}>{mwk(breakdown.totalInterest)}</div>
              <div className={styles.calcResultLabel}>{ny ? "Faida Yonse" : "Total Interest Payable"}</div>
            </div>
          </div>

          {/* Fees and Collateral */}
          {(institution.processingFeePercent || institution.insuranceFeePercent || institution.cashCollateralPercent) && (
            <div className={styles.feesSection}>
              <h4 className="text-sm" style={{ fontWeight: 600, marginBottom: "var(--space-sm)", marginTop: "var(--space-md)" }}>
                {ny ? "Ndalama Zowonjezera" : "Additional Fees & Collateral"}
              </h4>
              <div className="table-wrapper">
                <table className={styles.feesTable}>
                  <tbody>
                    {institution.processingFeePercent && (
                      <tr>
                        <td>{ny ? "Ndalama yopangira" : "Processing Fee"} ({institution.processingFeePercent}%)</td>
                        <td>{mwk(maxPrincipal * (institution.processingFeePercent / 100))}</td>
                      </tr>
                    )}
                    {institution.insuranceFeePercent && (
                      <tr>
                        <td>{ny ? "Inshuwalansi" : "Insurance"} ({institution.insuranceFeePercent}%)</td>
                        <td>{mwk(maxPrincipal * (institution.insuranceFeePercent / 100))}</td>
                      </tr>
                    )}
                    {institution.cashCollateralPercent && (
                      <tr>
                        <td>{ny ? "Ndalama yosungira yomweyo" : "Upfront Cash Collateral"} ({institution.cashCollateralPercent}%)</td>
                        <td>{mwk(maxPrincipal * (institution.cashCollateralPercent / 100))}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Affordability check */}
          {breakdown.monthlyRepayment > profileSummary.availableRepayment && (
            <div className="alert alert-warning" style={{ marginTop: "var(--space-md)" }}>
              ⚠ {ny
                ? `Malipiro apamwezi (${mwk(breakdown.monthlyRepayment)}) aposa malo otsala (${mwk(profileSummary.availableRepayment)}). Gwiritsani ntchito nthawi yaitali kapena ngongole yochepa.`
                : `The estimated monthly repayment (${mwk(breakdown.monthlyRepayment)}) exceeds your available repayment capacity (${mwk(profileSummary.availableRepayment)}). Consider a longer term or smaller amount.`}
            </div>
          )}
        </>
      )}

      {/* Repayment method note */}
      <div className={styles.repaymentNote}>
        <span className={styles.repaymentNoteIcon}>ℹ</span>
        <div>
          <strong>{ny ? "Njira ya Malipiro:" : "Repayment Method:"}</strong>{" "}
          {ny ? institution.repaymentMethodNoteNy : institution.repaymentMethodNote}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component: Comparison table
// ═══════════════════════════════════════════════════════════════════════════════
function ComparisonTable({
  institution, selectedProductId, ny,
}: {
  institution: InstitutionConfig;
  selectedProductId?: string;
  ny: boolean;
}) {
  const cf = institution.comparisonFields;

  let institutionDisplayName = institution.name;
  if (institution.requiresProductSelection && selectedProductId) {
    const selectedLoanType = institution.loanTypes.find(lt => lt.key === selectedProductId);
    if (selectedLoanType) {
      institutionDisplayName = `${institution.name} — ${ny ? selectedLoanType.labelNy : selectedLoanType.label}`;
    }
  }

  // Build the rows — conditionally include bank-specific rows
  const rows: [string, string, string][] = [
    ["Institution",        institutionDisplayName,                              "Malo"],
    ["Type",               institution.type,                                    "Mtundu"],
    ["Who can apply",      cf.whoCanApply,                                      "Amene angasindikize"],
    ["Minimum loan",       mwk(cf.minimumLoanMWK),                              "Ngongole yochepa"],
    ["Maximum loan",       `Up to ${mwk(cf.maximumLoanMWK)}`,                   "Ngongole yapadera"],
    ["Interest rate",      cf.interestRateLabel,                                "Faida"],
    ...(cf.repaymentPeriod
      ? [["Repayment period",  cf.repaymentPeriod,                              "Nthawi ya malipiro"] as [string, string, string]]
      : [["Repayment periods", institution.repaymentTermsMonths.map(m => `${m}m`).join(", ") + " months", "Nthawi ya malipiro"] as [string, string, string]]),
    ["Installment cap",    cf.debtToIncomeCapLabel,                             "Malire a malipiro"],
    ["Repayment method",   institution.repaymentMethod,                         "Njira ya malipiro"],
    ["Membership needed",  cf.membershipRequired,                               "Unansi wofunikira"],
    ["Proof of income",    cf.proofOfIncomeShort,                               "Umboni wa malipiro"],
    ...(cf.crbCheck
      ? [["CRB check",   cf.crbCheck,                                           "Kuwona CRB"] as [string, string, string]]
      : []),
    ["Collateral",         institution.collateralAccepted ? "Accepted" : "Not required", "Chingwe"],
    ["Turnaround time",    institution.turnaroundDays,                          "Nthawi yotsatira"],
    ...(cf.digitalApplication
      ? [["Digital application", cf.digitalApplication,                        "Kusindikiza pa intaneti"] as [string, string, string]]
      : []),
    ...(cf.repaymentReminders
      ? [["Repayment reminders", cf.repaymentReminders,                        "Zoikumbutsa malipiro"] as [string, string, string]]
      : []),
  ];

  return (
    <details
      className={`card ${styles.compareCard}`}
      style={{ marginBottom: "var(--space-lg)" }}
    >
      <summary
        style={{
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "1rem",
          padding: "4px 0",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
          listStyle: "none",
        }}
      >
        📊 {ny
          ? `Tebulo la Kuyerekeza — ${institutionDisplayName}`
          : `Side-by-Side Comparison — ${institutionDisplayName}`}
        <span className="text-sm" style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
          ({ny ? "dinani kuona" : "click to expand"})
        </span>
      </summary>

      <div style={{ marginTop: "var(--space-lg)" }}>
        <div className="table-wrapper">
          <table className={styles.compareTable}>
            <tbody>
              {rows.map(([enLabel, value, nyLabel]) => (
                <tr key={enLabel}>
                  <td>{ny ? nyLabel : enLabel}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Proof of income breakdown */}
        <div style={{ marginTop: "var(--space-lg)" }}>
          <h4 className="text-h3" style={{ marginBottom: "var(--space-md)", fontSize: "0.95rem" }}>
            {ny ? "Umboni wa Malipiro — Mndandanda" : "Proof of Income Requirements"}
          </h4>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{ny ? "Mtundu wa Mlongwe" : "Borrower Type"}</th>
                  <th>{ny ? "Umboni Wovomerezeka" : "Accepted Proof"}</th>
                </tr>
              </thead>
              <tbody>
                {institution.proofOfIncome.map((row) => (
                  <tr key={row.borrowerType}>
                    <td>{row.borrowerType}</td>
                    <td>{ny ? row.acceptedNy : row.accepted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Credit factors — shown for banks only */}
        {institution.creditFactors && institution.creditFactors.length > 0 && (
          <div style={{ marginTop: "var(--space-lg)" }}>
            <h4 className="text-h3" style={{ marginBottom: "var(--space-md)", fontSize: "0.95rem" }}>
              {ny ? "Zomwe Banki Imawona — Mndandanda" : "Credit Factors Considered"}
            </h4>
            <ul style={{ paddingLeft: "var(--space-lg)", color: "var(--color-text-secondary)", fontSize: "0.9rem", lineHeight: 1.8 }}>
              {institution.creditFactors.map(f => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component: FINCA intake form
// ═══════════════════════════════════════════════════════════════════════════════
function FincaIntakeForm({
  intake, onChange, ny,
}: {
  intake: FincaIntakeData;
  onChange: (d: FincaIntakeData) => void;
  ny: boolean;
}) {
  return (
    <div className={`card ${styles.intakeCard}`}>
      <div className={styles.intakeTitle}>
        <div className={styles.intakeIcon}>👥</div>
        <div>
          <h2 className="text-h3">{ny ? "Zambiri za Ngongole ya Gulu" : "Group Loan Details"}</h2>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {ny
              ? "Ngongole izi zimafuna gulu. Yankhani mafunso otsatirawa."
              : "These loans require you to be part of a business group. Answer the questions below."}
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ gap: "var(--space-lg)", marginTop: "var(--space-md)" }}>
        {/* Part of group */}
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label className="form-label">
            {ny ? "Kodi muli mgulu la bizinesi?" : "Are you part of a business group?"}
          </label>
          <div style={{ display: "flex", gap: "var(--space-md)", marginTop: "var(--space-sm)" }}>
            {[true, false].map(val => (
              <label
                key={String(val)}
                className={`${styles.radioBtn} ${intake.isPartOfGroup === val ? styles.selected : ""}`}
                style={{
                  display: "flex", alignItems: "center", gap: "var(--space-sm)", cursor: "pointer",
                  padding: "10px 18px", borderRadius: "var(--radius-md)",
                  border: `1.5px solid ${intake.isPartOfGroup === val ? "var(--color-primary)" : "var(--color-border)"}`,
                  background: intake.isPartOfGroup === val ? "var(--color-primary-glow)" : "transparent",
                  fontSize: "0.9rem", fontWeight: 500,
                }}
              >
                <input
                  type="radio"
                  name="isPartOfGroup"
                  checked={intake.isPartOfGroup === val}
                  onChange={() => onChange({ ...intake, isPartOfGroup: val })}
                  style={{ display: "none" }}
                />
                {val ? (ny ? "Inde" : "Yes") : (ny ? "Ayi" : "No")}
              </label>
            ))}
          </div>
        </div>

        {/* Group size */}
        {intake.isPartOfGroup && (
          <div className="form-group">
            <label className="form-label" htmlFor="groupSize">
              {ny ? "Anthu angati alipo mgulu lanu?" : "How many members are in your group?"}
            </label>
            <input
              id="groupSize"
              type="number"
              min={1}
              max={100}
              className="form-input"
              placeholder={ny ? "mwachitsanzo: 10" : "e.g. 10"}
              value={intake.groupSize || ""}
              onChange={e => onChange({ ...intake, groupSize: parseInt(e.target.value) || 0 })}
            />
            <div className="form-help">
              {ny ? "Gulu liyenera kukhala ndi anthu 5 mpaka 25." : "Must be between 5 and 25 members."}
            </div>
          </div>
        )}

        {/* Owns business */}
        <div className="form-group">
          <label className="form-label">
            {ny ? "Kodi mumayendetsa bizinesi?" : "Do you actively own or run a business?"}
          </label>
          <div style={{ display: "flex", gap: "var(--space-md)", marginTop: "var(--space-sm)" }}>
            {[true, false].map(val => (
              <label
                key={String(val)}
                className={`${styles.radioBtn} ${intake.ownsBusiness === val ? styles.selected : ""}`}
                style={{
                  display: "flex", alignItems: "center", gap: "var(--space-sm)", cursor: "pointer",
                  padding: "10px 18px", borderRadius: "var(--radius-md)",
                  border: `1.5px solid ${intake.ownsBusiness === val ? "var(--color-primary)" : "var(--color-border)"}`,
                  background: intake.ownsBusiness === val ? "var(--color-primary-glow)" : "transparent",
                  fontSize: "0.9rem", fontWeight: 500,
                }}
              >
                <input
                  type="radio"
                  name="ownsBusiness"
                  checked={intake.ownsBusiness === val}
                  onChange={() => onChange({ ...intake, ownsBusiness: val })}
                  style={{ display: "none" }}
                />
                {val ? (ny ? "Inde" : "Yes") : (ny ? "Ayi" : "No")}
              </label>
            ))}
          </div>
        </div>

        {/* FINCA account */}
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label className="form-label">
            {ny ? "Kodi muli ndi akaunti ya FINCA?" : "Do you currently have a FINCA account, or are you willing to open one?"}
          </label>
          <div style={{ display: "flex", gap: "var(--space-md)", marginTop: "var(--space-sm)", flexWrap: "wrap" }}>
            {[
              { val: 'yes', labelEn: 'Yes, I have one', labelNy: 'Inde, ndili nayo' },
              { val: 'willing', labelEn: 'Willing to open', labelNy: 'Ndingatsegule' },
              { val: 'no', labelEn: 'No', labelNy: 'Ayi' },
            ].map(opt => (
              <label
                key={opt.val}
                className={`${styles.radioBtn} ${intake.hasFincaAccount === opt.val ? styles.selected : ""}`}
                style={{
                  display: "flex", alignItems: "center", gap: "var(--space-sm)", cursor: "pointer",
                  padding: "10px 18px", borderRadius: "var(--radius-md)",
                  border: `1.5px solid ${intake.hasFincaAccount === opt.val ? "var(--color-primary)" : "var(--color-border)"}`,
                  background: intake.hasFincaAccount === opt.val ? "var(--color-primary-glow)" : "transparent",
                  fontSize: "0.9rem", fontWeight: 500,
                }}
              >
                <input
                  type="radio"
                  name="hasFincaAccount"
                  checked={intake.hasFincaAccount === opt.val}
                  onChange={() => onChange({ ...intake, hasFincaAccount: opt.val as 'yes'|'willing'|'no' })}
                  style={{ display: "none" }}
                />
                {ny ? opt.labelNy : opt.labelEn}
              </label>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
