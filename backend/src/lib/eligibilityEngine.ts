// ─────────────────────────────────────────────────────────────────────────────
// Shared Eligibility Engine — used by both backend service and frontend preview
// ─────────────────────────────────────────────────────────────────────────────

/** Employment categories that drive multiplier logic */
export type EmploymentCategory =
  | 'civil_servant'
  | 'private_sector'
  | 'self_employed'
  | 'sacco_member';

/** Institution criteria data shape returned from DB */
export interface InstitutionCriteriaData {
  interestRate: number;
  maxDtiRatio: number;
  minNetSalary: number;
  minRepaymentMonths: number;
  maxRepaymentMonths: number;
  processingFeePercent: number;
  civilServantMultiplier: number;
  privateMultiplier: number;
  selfEmployedMultiplier: number;
  saccoMemberMultiplier: number;
  eligibleEmploymentTypes: string[];
  requiresGuarantor: boolean;
  requiresPayslip: boolean;
  notes: string;
}

/** Full result for a single institution eligibility check */
export interface InstitutionEligibilityResult {
  institutionId: number;
  institutionName: string;
  institutionType: string;
  eligible: boolean;
  ineligibilityReason?: string;

  // Loan capacity
  maxLoanAmount: number;
  requestedAmount: number;
  requestedAmountEligible: boolean; // can they afford the specific amount requested?

  // Financials for requested amount
  estimatedMonthlyInstallment: number;
  totalRepayable: number;
  processingFee: number;

  // Rates & terms
  interestRate: number;
  minTerm: number;
  maxTerm: number;
  processingFeePercent: number;

  // Conditions
  requiresGuarantor: boolean;
  requiresPayslip: boolean;
  notes: string;

  // Ranking
  rank?: number;
  dtiIfApproved: number;
}

/** Top-level result returned from compare endpoint */
export interface CompareResult {
  ranked: InstitutionEligibilityResult[];      // eligible only, rank 1–5
  ineligible: InstitutionEligibilityResult[];  // not eligible, with reasons
  profileSummary: {
    salary: number;
    existingRepayments: number;
    availableRepaymentCapacity: number;
    employmentCategory: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Core math helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates fixed monthly installment (EMI) using the standard annuity formula:
 *   EMI = [P × R × (1+R)^N] / [(1+R)^N − 1]
 * @param amount    Principal in MK
 * @param annualRate Annual interest rate as percentage (e.g. 25 for 25%)
 * @param months    Repayment term in months
 */
export function calculateMonthlyInstallment(
  amount: number,
  annualRate: number,
  months: number,
): number {
  if (annualRate === 0) return amount / months;
  const r = annualRate / 100 / 12;
  const n = months;
  const factor = Math.pow(1 + r, n);
  return (amount * r * factor) / (factor - 1);
}

/**
 * Back-calculates the maximum principal given a maximum affordable monthly payment.
 *   P = EMI × [(1+R)^N − 1] / [R × (1+R)^N]
 */
export function calculateMaxPrincipal(
  maxMonthlyPayment: number,
  annualRate: number,
  months: number,
): number {
  if (annualRate === 0) return maxMonthlyPayment * months;
  const r = annualRate / 100 / 12;
  const n = months;
  const factor = Math.pow(1 + r, n);
  return (maxMonthlyPayment * (factor - 1)) / (r * factor);
}

/**
 * Returns the correct salary multiplier for the given employment category.
 */
export function getMultiplier(
  category: EmploymentCategory,
  criteria: InstitutionCriteriaData,
): number {
  switch (category) {
    case 'civil_servant':  return criteria.civilServantMultiplier;
    case 'private_sector': return criteria.privateMultiplier;
    case 'self_employed':  return criteria.selfEmployedMultiplier;
    case 'sacco_member':   return criteria.saccoMemberMultiplier;
    default:               return criteria.privateMultiplier;
  }
}

/** DTI ratio as a percentage */
export function calculateDtiRatio(
  monthlySalary: number,
  existingRepayments: number,
  newInstallment: number,
): number {
  if (monthlySalary === 0) return 0;
  return ((existingRepayments + newInstallment) / monthlySalary) * 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core eligibility calculation per institution
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckInstitutionParams {
  institutionId: number;
  institutionName: string;
  institutionType: string;
  criteria: InstitutionCriteriaData;
  monthlyNetSalary: number;
  existingMonthlyRepayments: number;
  employmentCategory: EmploymentCategory;
  requestedAmount: number;
  requestedTermMonths: number;
}

export function checkInstitution(p: CheckInstitutionParams): InstitutionEligibilityResult {
  const {
    criteria, monthlyNetSalary, existingMonthlyRepayments,
    employmentCategory, requestedAmount, requestedTermMonths,
  } = p;

  // ── 1. Employment type gate ──────────────────────────────────────
  if (!criteria.eligibleEmploymentTypes.includes(employmentCategory)) {
    return buildResult(p, false, `${p.institutionName} does not lend to ${formatCategory(employmentCategory)} employees.`);
  }

  // ── 2. Minimum net salary gate ───────────────────────────────────
  if (monthlyNetSalary < criteria.minNetSalary) {
    return buildResult(p, false,
      `Minimum net salary required is MK ${criteria.minNetSalary.toLocaleString()}. Yours is MK ${monthlyNetSalary.toLocaleString()}.`);
  }

  // ── 3. Calculate max affordable monthly payment ──────────────────
  // Available capacity after existing repayments
  const maxAffordableRepayment =
    (criteria.maxDtiRatio * monthlyNetSalary) - existingMonthlyRepayments;

  if (maxAffordableRepayment <= 0) {
    return buildResult(p, false, 'Existing loan repayments already exceed this institution\'s DTI limit.');
  }

  // ── 4. Calculate max loan amount (constrained by DTI and salary multiplier) ──
  const clampedTerm = Math.min(
    Math.max(requestedTermMonths, criteria.minRepaymentMonths),
    criteria.maxRepaymentMonths,
  );

  const maxByDti = calculateMaxPrincipal(maxAffordableRepayment, criteria.interestRate, clampedTerm);
  const maxByMultiplier = monthlyNetSalary * getMultiplier(employmentCategory, criteria);
  const maxLoanAmount = Math.max(0, Math.min(maxByDti, maxByMultiplier));

  // ── 5. Check if requested term is within institution limits ───────
  if (requestedTermMonths < criteria.minRepaymentMonths || requestedTermMonths > criteria.maxRepaymentMonths) {
    return buildResult(p, false,
      `Repayment period must be between ${criteria.minRepaymentMonths} and ${criteria.maxRepaymentMonths} months.`, maxLoanAmount);
  }

  // ── 6. Determine eligibility for requested amount ─────────────────
  const requestedInstallment = calculateMonthlyInstallment(requestedAmount, criteria.interestRate, requestedTermMonths);
  const dtiIfApproved = calculateDtiRatio(monthlyNetSalary, existingMonthlyRepayments, requestedInstallment);
  const requestedAmountEligible = requestedAmount <= maxLoanAmount && dtiIfApproved <= criteria.maxDtiRatio * 100;

  const eligible = maxLoanAmount > 0;

  return {
    institutionId: p.institutionId,
    institutionName: p.institutionName,
    institutionType: p.institutionType,
    eligible,
    ineligibilityReason: eligible ? undefined : 'Insufficient borrowing capacity at this institution.',
    maxLoanAmount: Math.round(maxLoanAmount),
    requestedAmount,
    requestedAmountEligible,
    estimatedMonthlyInstallment: Math.round(requestedInstallment),
    totalRepayable: Math.round(requestedInstallment * requestedTermMonths),
    processingFee: Math.round(requestedAmount * (criteria.processingFeePercent / 100)),
    interestRate: criteria.interestRate,
    minTerm: criteria.minRepaymentMonths,
    maxTerm: criteria.maxRepaymentMonths,
    processingFeePercent: criteria.processingFeePercent,
    requiresGuarantor: criteria.requiresGuarantor,
    requiresPayslip: criteria.requiresPayslip,
    notes: criteria.notes || '',
    dtiIfApproved: parseFloat(dtiIfApproved.toFixed(1)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Institution ranking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs eligibility against a list of institutions and returns a ranked top-5
 * plus the ineligible set with reasons.
 */
export function rankInstitutions(
  institutions: CheckInstitutionParams[],
): CompareResult {
  const results = institutions.map(inst => checkInstitution(inst));

  const eligible = results
    .filter(r => r.eligible)
    .sort((a, b) => b.maxLoanAmount - a.maxLoanAmount)
    .slice(0, 5)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const ineligible = results.filter(r => !r.eligible);

  const first = institutions[0];
  const maxDti = first?.criteria?.maxDtiRatio ?? 0.4;
  const salary = first?.monthlyNetSalary ?? 0;
  const existing = first?.existingMonthlyRepayments ?? 0;

  return {
    ranked: eligible,
    ineligible,
    profileSummary: {
      salary,
      existingRepayments: existing,
      availableRepaymentCapacity: Math.max(0, salary * maxDti - existing),
      employmentCategory: first?.employmentCategory ?? '',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildResult(
  p: CheckInstitutionParams,
  eligible: false,
  reason: string,
  maxLoanAmount = 0,
): InstitutionEligibilityResult {
  const installment = calculateMonthlyInstallment(p.requestedAmount, p.criteria.interestRate, p.requestedTermMonths);
  return {
    institutionId: p.institutionId,
    institutionName: p.institutionName,
    institutionType: p.institutionType,
    eligible,
    ineligibilityReason: reason,
    maxLoanAmount,
    requestedAmount: p.requestedAmount,
    requestedAmountEligible: false,
    estimatedMonthlyInstallment: Math.round(installment),
    totalRepayable: Math.round(installment * p.requestedTermMonths),
    processingFee: Math.round(p.requestedAmount * (p.criteria.processingFeePercent / 100)),
    interestRate: p.criteria.interestRate,
    minTerm: p.criteria.minRepaymentMonths,
    maxTerm: p.criteria.maxRepaymentMonths,
    processingFeePercent: p.criteria.processingFeePercent,
    requiresGuarantor: p.criteria.requiresGuarantor,
    requiresPayslip: p.criteria.requiresPayslip,
    notes: p.criteria.notes || '',
    dtiIfApproved: 0,
  };
}

function formatCategory(cat: string): string {
  const map: Record<string, string> = {
    civil_servant: 'Civil Servant',
    private_sector: 'Private Sector',
    self_employed: 'Self-Employed',
    sacco_member: 'SACCO Member',
  };
  return map[cat] ?? cat;
}
