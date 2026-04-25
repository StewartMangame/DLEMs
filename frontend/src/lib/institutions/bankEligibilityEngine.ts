// ─────────────────────────────────────────────────────────────────────────────
// Bank Eligibility Engine
// Implements the ordered eligibility rules for commercial bank institutions.
// Rules are evaluated in order and stop at the first hard failure (fail-fast).
// Unlike the SACCO engine, this engine can return a 'borderline' status when
// a CRB flag is declared (amber — application may still proceed but is flagged).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  InstitutionConfig,
  EligibilityResult,
  BankIntakeData,
  LoanTypeResult,
  EmploymentCategory,
} from './types';

export { calcMonthlyInstallment, calcLoanBreakdown } from './saccoEligibilityEngine';

export interface BankCheckInput {
  // From user financial profile
  employmentCategory: EmploymentCategory;
  monthlyNetIncome: number;
  serviceMonths: number;          // length of employment in months
  existingMonthlyObligations: number;

  // From bank intake form
  bank: BankIntakeData;
}

/**
 * Runs the FDH Bank (and any future commercial bank) eligibility rules.
 * Rules are documented inline — applied in order, stop at first hard failure.
 */
export function runBankEligibility(
  institution: InstitutionConfig,
  input: BankCheckInput,
): EligibilityResult {
  const {
    employmentCategory,
    monthlyNetIncome,
    serviceMonths,
    existingMonthlyObligations,
    bank,
  } = input;

  const cap = institution.debtToIncomeCapPercent / 100; // e.g. 0.30 for FDH Bank
  const availableRepayment = Math.max(0, monthlyNetIncome * cap - existingMonthlyObligations);

  const profileSummary = {
    monthlyIncome: monthlyNetIncome,
    existingObligations: existingMonthlyObligations,
    availableRepayment,
    serviceMonths,
  };

  // ── Rule 1: Employment category ──────────────────────────────────────────
  // Civil servants and private sector employees only. Self-employed not eligible.
  if (!institution.eligibleEmploymentCategories.includes(employmentCategory)) {
    return {
      status: 'not_eligible',
      institution,
      failedRule:
        `${institution.name} accepts civil servants and private sector employees only. ` +
        `Self-employed applicants are not eligible for this institution.`,
      failedRuleNy:
        `${institution.name} imalandira ogwira ntchito boma ndi ogwira ntchito m'mabizinesi okha. ` +
        `Omwe ali ndi bizinesi zawo samamverera.`,
      profileSummary,
    };
  }

  // ── Rule 2: Minimum length of employment ─────────────────────────────────
  if (serviceMonths < institution.minimumServiceMonths) {
    return {
      status: 'not_eligible',
      institution,
      failedRule:
        `You need at least ${institution.minimumServiceMonths} months of employment history ` +
        `to apply with ${institution.name}. You have ${serviceMonths} months.`,
      failedRuleNy:
        `Mufuna miyezi ${institution.minimumServiceMonths} ya ntchito kuti musindikize ku ${institution.name}. ` +
        `Muli ndi miyezi ${serviceMonths} yokha.`,
      profileSummary,
    };
  }

  // ── Rule 3: CRB self-declaration (borderline, not a hard stop) ───────────
  // If the user declares a CRB flag, return borderline (amber) — not a disqualification,
  // but the institution will see it during processing.
  if (bank.hasCrbFlag === true) {
    // We still calculate loan amounts so the user can see their capacity.
    const loanTypeResults = buildLoanTypeResults(institution, availableRepayment);
    return {
      status: 'borderline',
      institution,
      failedRule:
        `${institution.name} always checks CRB records before approving a loan. ` +
        `An outstanding CRB flag may affect your application.`,
      failedRuleNy:
        `${institution.name} imawona zolemba za CRB nthawi yonse isanapereke ngongole. ` +
        `Zolemba za CRB zimatha kukhudza pangano lanu.`,
      loanTypeResults,
      profileSummary,
    };
  }

  // ── Rule 4: Available repayment capacity ─────────────────────────────────
  const rawAvailable = monthlyNetIncome * cap - existingMonthlyObligations;
  if (rawAvailable <= 0) {
    return {
      status: 'not_eligible',
      institution,
      failedRule:
        `Your existing monthly loan obligations already exceed your available ` +
        `${institution.debtToIncomeCapPercent}% repayment capacity at ${institution.name}. ` +
        `No additional capacity remains.`,
      failedRuleNy:
        `Malembero anu apamwezi ekha adatha ${institution.debtToIncomeCapPercent}% ya malipiro anu ku ${institution.name}. ` +
        `Palibe malo enawo osongola ngongole.`,
      profileSummary,
    };
  }

  // ── Rule 5 (informational): Civil servant note ────────────────────────────
  // Civil servants may receive special interest rate and tenure conditions.
  // This is informational only — it does NOT affect the eligibility outcome.
  const isCivilServant = employmentCategory === 'civil_servant';
  const civilServantNote = isCivilServant
    ? `You are applying as a civil servant. ${institution.name} may offer special interest rate and tenure conditions for civil servants. Your final terms may differ from those of a private sector employee with the same profile. Confirm the applicable rate directly with the bank.`
    : undefined;
  const civilServantNoteNy = isCivilServant
    ? `Mukusindikiza monga ogwira ntchito boma. ${institution.name} ingapereke mlingo wapadera wa faida ndi nthawi kwa ogwira ntchito boma. Zotsatira zanu zingathawe ndi zomwe ogwira ntchito m'mabizinesi alandira. Tsimikizani mlingo woyenera ndi banki.`
    : undefined;

  // ── Rule 6: Likely Eligible — calculate max per loan type ────────────────
  const loanTypeResults = buildLoanTypeResults(institution, availableRepayment);

  return {
    status: 'likely_eligible',
    institution,
    loanTypeResults,
    civilServantNote,
    civilServantNoteNy,
    profileSummary: { ...profileSummary, availableRepayment },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildLoanTypeResults(
  institution: InstitutionConfig,
  availableRepayment: number,
): LoanTypeResult[] {
  return institution.loanTypes.map(lt => {
    // Capacity proxy at 0% interest — user enters actual rate in the calculator.
    const uncappedMax = availableRepayment * 24;
    const cappedToLoanType = Math.min(uncappedMax, lt.maxAmountMWK);
    const isCapped = uncappedMax >= lt.maxAmountMWK;
    return {
      loanType: lt,
      maxAffordableMWK: Math.max(lt.minAmountMWK, Math.min(cappedToLoanType, lt.maxAmountMWK)),
      cappedAtMax: isCapped,
    };
  });
}
