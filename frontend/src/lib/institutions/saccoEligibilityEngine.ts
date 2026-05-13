// ─────────────────────────────────────────────────────────────────────────────
// SACCO Eligibility Engine
// Implements the ordered eligibility rules for SACCO-type institutions.
// Rules are evaluated in order and stop at the first failure (fail-fast).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  InstitutionConfig,
  EligibilityResult,
  SaccoIntakeData,
  LoanTypeResult,
  EmploymentCategory,
} from './types';

// Legacy export alias
export type { EligibilityResult as SaccoEligibilityResult } from './types';

export interface SaccoCheckInput {
  // From user financial profile
  employmentCategory: EmploymentCategory;
  monthlyNetIncome: number;
  serviceMonths: number;         // length of service or time in business (months)
  existingMonthlyObligations: number;

  // From SACCO intake form
  sacco: SaccoIntakeData;
}

/**
 * Calculates the maximum loan principal given a maximum affordable monthly payment.
 * Formula: P = EMI × [(1+R)^N − 1] / [R × (1+R)^N]
 */
function calcMaxPrincipal(maxMonthlyPayment: number, annualRatePct: number, months: number): number {
  if (annualRatePct === 0) return maxMonthlyPayment * months;
  const r = annualRatePct / 100 / 12;
  const factor = Math.pow(1 + r, months);
  return (maxMonthlyPayment * (factor - 1)) / (r * factor);
}

/**
 * Calculates the fixed monthly installment (EMI).
 * Formula: EMI = [P × R × (1+R)^N] / [(1+R)^N − 1]
 */
export function calcMonthlyInstallment(principal: number, annualRatePct: number, months: number): number {
  if (annualRatePct === 0 || months === 0) return months > 0 ? principal / months : 0;
  const r = annualRatePct / 100 / 12;
  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
}

/**
 * Runs the SACCO eligibility rules for a given institution and user input.
 * Rules are applied in order; evaluation stops at the first failure.
 */
export function runSaccoEligibility(
  institution: InstitutionConfig,
  input: SaccoCheckInput,
): EligibilityResult {
  const {
    employmentCategory,
    monthlyNetIncome,
    serviceMonths,
    existingMonthlyObligations,
    sacco,
  } = input;

  const cap = institution.debtToIncomeCapPercent / 100; // e.g. 0.40

  const profileSummary = {
    monthlyIncome: monthlyNetIncome,
    existingObligations: existingMonthlyObligations,
    availableRepayment: Math.max(0, monthlyNetIncome * cap - existingMonthlyObligations),
    membershipMonths: sacco.saccoMembershipMonths,
    serviceMonths,
  };

  // ── Rule 1: Must be a registered SACCO member ────────────────────────────
  // Employment category is irrelevant — SACCO is open to any member regardless
  // of whether they are a civil servant, private sector, or self-employed.
  // The only gate is: are you a registered member of this SACCO?
  if (!sacco.isSaccoMember) {
    return {
      status: 'not_eligible',
      institution,
      failedRule: `Malawi Police SACCO is open to SACCO members only. You must be a registered member to apply for a loan.`,
      failedRuleNy: `SACCO ya Apolisi a Malawi imatsegulira okha omwe ali membala wa SACCO. Muyenera kukhala membala woyenera kuti musindikize ngongole.`,
      profileSummary,
    };
  }

  // ── Rule 2: Minimum SACCO membership duration ─────────────────────────────
  if (sacco.saccoMembershipMonths < institution.minimumMembershipMonths) {
    return {
      status: 'not_yet_eligible',
      institution,
      failedRule: `You do not yet meet the minimum ${institution.minimumMembershipMonths}-month membership requirement for ${institution.name}.`,
      failedRuleNy: `Simufikira nthawi yoyenera ya miyezi ${institution.minimumMembershipMonths} ya unansi wa SACCO kwa ${institution.name}.`,
      profileSummary,
    };
  }

  // ── Rule 3: Minimum net monthly income ───────────────────────────────────
  if (monthlyNetIncome < institution.minimumMonthlyIncomeMWK) {
    return {
      status: 'not_eligible',
      institution,
      failedRule: `Your net monthly income of MWK ${monthlyNetIncome.toLocaleString()} is below the minimum required MWK ${institution.minimumMonthlyIncomeMWK.toLocaleString()}.`,
      failedRuleNy: `Malipiro anu apamwezi a MWK ${monthlyNetIncome.toLocaleString()} ndi otsika kuposa oyenera a MWK ${institution.minimumMonthlyIncomeMWK.toLocaleString()}.`,
      profileSummary,
    };
  }

  // ── Rule 4: Minimum length of service ────────────────────────────────────
  if (serviceMonths < institution.minimumServiceMonths) {
    return {
      status: 'not_eligible',
      institution,
      failedRule: `You need at least ${institution.minimumServiceMonths} months of employment or business history. You have ${serviceMonths} months.`,
      failedRuleNy: `Mufuna miyezi ${institution.minimumServiceMonths} ya ntchito kapena bizinesi. Muli ndi miyezi ${serviceMonths} yokha.`,
      profileSummary,
    };
  }

  // ── Rule 5: Available repayment capacity ──────────────────────────────────
  const availableRepayment = monthlyNetIncome * cap - existingMonthlyObligations;
  if (availableRepayment <= 0) {
    return {
      status: 'not_eligible',
      institution,
      failedRule: `Your existing monthly loan obligations already consume your full ${institution.debtToIncomeCapPercent}% debt-to-income limit. No additional repayment capacity is available.`,
      failedRuleNy: `Malembero anu apamwezi ekha adatha ${institution.debtToIncomeCapPercent}% ya malipiro anu. Palibe malo enawo osongola ngongole.`,
      profileSummary,
    };
  }

  // ── Rule 6: Likely Eligible — calculate max per loan type ────────────────
  const loanTypeResults: LoanTypeResult[] = institution.loanTypes.map(lt => {
    // Max principled from affordable repayment, using a mid-range reference rate (user will enter
    // actual rate in the calculator — here we compute the unconstrained capacity figure).
    // We'll store the raw affordableRepayment and cap it to the loan type maximum.
    const uncappedMax = availableRepayment * 24; // simple proxy at 0% interest for display purposes
    const cappedToLoanType = Math.min(uncappedMax, lt.maxAmountMWK);
    const isCapped = uncappedMax >= lt.maxAmountMWK;

    return {
      loanType: lt,
      maxAffordableMWK: Math.max(lt.minAmountMWK, Math.min(cappedToLoanType, lt.maxAmountMWK)),
      cappedAtMax: isCapped,
    };
  });

  return {
    status: 'likely_eligible',
    institution,
    loanTypeResults,
    profileSummary: { ...profileSummary, availableRepayment },
  };
}

/**
 * Calculates the loan breakdown for the repayment calculator.
 */
export function calcLoanBreakdown(
  principal: number,
  annualRatePct: number,
  termMonths: number,
): { monthlyRepayment: number; totalRepayment: number; totalInterest: number } {
  const monthly = calcMonthlyInstallment(principal, annualRatePct, termMonths);
  const total = monthly * termMonths;
  return {
    monthlyRepayment: Math.round(monthly),
    totalRepayment: Math.round(total),
    totalInterest: Math.round(total - principal),
  };
}
