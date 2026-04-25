// ─────────────────────────────────────────────────────────────────────────────
// Frontend-side Eligibility Engine — shared types & math helpers
// Mirrors the backend lib for client-side preview calculations.
// ─────────────────────────────────────────────────────────────────────────────

export type EmploymentCategory =
  | 'civil_servant'
  | 'private_sector'
  | 'self_employed'
  | 'sacco_member';

/** Result returned by the backend compare endpoint for each institution */
export interface InstitutionEligibilityResult {
  institutionId: number;
  institutionName: string;
  institutionType: string;
  eligible: boolean;
  ineligibilityReason?: string;
  maxLoanAmount: number;
  requestedAmount: number;
  requestedAmountEligible: boolean;
  estimatedMonthlyInstallment: number;
  totalRepayable: number;
  processingFee: number;
  interestRate: number;
  minTerm: number;
  maxTerm: number;
  processingFeePercent: number;
  requiresGuarantor: boolean;
  requiresPayslip: boolean;
  notes: string;
  rank?: number;
  dtiIfApproved: number;
}

/** Top-level result from the compare endpoint */
export interface CompareResult {
  ranked: InstitutionEligibilityResult[];
  ineligible: InstitutionEligibilityResult[];
  profileSummary: {
    salary: number;
    existingRepayments: number;
    availableRepaymentCapacity: number;
    employmentCategory: string;
  };
}

/** Legacy result shape — kept for backward compatibility */
export interface EligibilityResult {
  eligible: boolean;
  monthlyInstallment: number;
  totalRepayable: number;
  dtiRatio: number;
  maxLoanAmount: number;
  riskScore: number;
  riskCategory: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  breakdown: {
    employment: number;
    employmentYears: number;
    age: number;
    housing: number;
    banking: number;
  };
}

/**
 * Calculates fixed monthly installment (EMI)
 * Formula: [P × R × (1+R)^N] / [(1+R)^N − 1]
 */
export function calculateMonthlyInstallment(amount: number, annualRate: number, months: number): number {
  if (annualRate === 0) return amount / months;
  const r = annualRate / 100 / 12;
  const factor = Math.pow(1 + r, months);
  return (amount * r * factor) / (factor - 1);
}

export function calculateDtiRatio(monthlySalary: number, existingRepayments: number, newInstallment: number): number {
  if (monthlySalary === 0) return 0;
  return ((existingRepayments + newInstallment) / monthlySalary) * 100;
}
