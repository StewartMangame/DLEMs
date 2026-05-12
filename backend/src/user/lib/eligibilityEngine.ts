// Shared eligibility engine used by backend services and frontend previews.

export type EmploymentCategory =
  | 'civil_servant'
  | 'private_sector'
  | 'self_employed'
  | 'sacco_member';

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

export function calculateMonthlyInstallment(
  amount: number,
  annualRate: number,
  months: number,
): number {
  if (months <= 0) return 0;
  if (annualRate === 0) return amount / months;

  const monthlyRate = annualRate / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, months);
  return (amount * monthlyRate * factor) / (factor - 1);
}

export function calculateMaxPrincipal(
  maxMonthlyPayment: number,
  annualRate: number,
  months: number,
): number {
  if (months <= 0 || maxMonthlyPayment <= 0) return 0;
  if (annualRate === 0) return maxMonthlyPayment * months;

  const monthlyRate = annualRate / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, months);
  return (maxMonthlyPayment * (factor - 1)) / (monthlyRate * factor);
}

export function getMultiplier(
  category: EmploymentCategory,
  criteria: InstitutionCriteriaData,
): number {
  switch (category) {
    case 'civil_servant':
      return criteria.civilServantMultiplier;
    case 'private_sector':
      return criteria.privateMultiplier;
    case 'self_employed':
      return criteria.selfEmployedMultiplier;
    case 'sacco_member':
      return criteria.saccoMemberMultiplier;
    default:
      return criteria.privateMultiplier;
  }
}

export function calculateDtiRatio(
  monthlySalary: number,
  existingRepayments: number,
  newInstallment: number,
): number {
  if (monthlySalary <= 0) return 0;
  return ((existingRepayments + newInstallment) / monthlySalary) * 100;
}

export function checkInstitution(
  p: CheckInstitutionParams,
): InstitutionEligibilityResult {
  const {
    criteria,
    monthlyNetSalary,
    existingMonthlyRepayments,
    employmentCategory,
    requestedAmount,
    requestedTermMonths,
  } = p;

  if (!criteria.eligibleEmploymentTypes.includes(employmentCategory)) {
    return buildResult(
      p,
      `${p.institutionName} does not lend to ${formatCategory(employmentCategory)} borrowers.`,
    );
  }

  if (monthlyNetSalary < criteria.minNetSalary) {
    return buildResult(
      p,
      `Minimum net salary required is MK ${criteria.minNetSalary.toLocaleString()}. Yours is MK ${monthlyNetSalary.toLocaleString()}.`,
    );
  }

  const maxAffordableRepayment =
    criteria.maxDtiRatio * monthlyNetSalary - existingMonthlyRepayments;

  if (maxAffordableRepayment <= 0) {
    return buildResult(
      p,
      "Existing loan repayments already exceed this institution's DTI limit.",
    );
  }

  const clampedTerm = Math.min(
    Math.max(requestedTermMonths, criteria.minRepaymentMonths),
    criteria.maxRepaymentMonths,
  );
  const maxByDti = calculateMaxPrincipal(
    maxAffordableRepayment,
    criteria.interestRate,
    clampedTerm,
  );
  const maxByMultiplier =
    monthlyNetSalary * getMultiplier(employmentCategory, criteria);
  const maxLoanAmount = Math.max(0, Math.min(maxByDti, maxByMultiplier));

  if (
    requestedTermMonths < criteria.minRepaymentMonths ||
    requestedTermMonths > criteria.maxRepaymentMonths
  ) {
    return buildResult(
      p,
      `Repayment period must be between ${criteria.minRepaymentMonths} and ${criteria.maxRepaymentMonths} months.`,
      maxLoanAmount,
    );
  }

  const requestedInstallment = calculateMonthlyInstallment(
    requestedAmount,
    criteria.interestRate,
    requestedTermMonths,
  );
  const dtiIfApproved = calculateDtiRatio(
    monthlyNetSalary,
    existingMonthlyRepayments,
    requestedInstallment,
  );
  const requestedAmountEligible =
    requestedAmount <= maxLoanAmount &&
    dtiIfApproved <= criteria.maxDtiRatio * 100;
  const eligible = requestedAmountEligible;

  return {
    institutionId: p.institutionId,
    institutionName: p.institutionName,
    institutionType: p.institutionType,
    eligible,
    ineligibilityReason: eligible
      ? undefined
      : buildRequestedAmountReason(
          requestedAmount,
          maxLoanAmount,
          dtiIfApproved,
          criteria.maxDtiRatio,
        ),
    maxLoanAmount: Math.round(maxLoanAmount),
    requestedAmount,
    requestedAmountEligible,
    estimatedMonthlyInstallment: Math.round(requestedInstallment),
    totalRepayable: Math.round(requestedInstallment * requestedTermMonths),
    processingFee: Math.round(
      requestedAmount * (criteria.processingFeePercent / 100),
    ),
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

export function rankInstitutions(
  institutions: CheckInstitutionParams[],
): CompareResult {
  const results = institutions.map((inst) => checkInstitution(inst));

  const ranked = results
    .filter((result) => result.eligible && result.requestedAmountEligible)
    .sort((a, b) => {
      if (a.interestRate !== b.interestRate)
        return a.interestRate - b.interestRate;
      if (a.dtiIfApproved !== b.dtiIfApproved)
        return a.dtiIfApproved - b.dtiIfApproved;
      return b.maxLoanAmount - a.maxLoanAmount;
    })
    .slice(0, 5)
    .map((result, index) => ({ ...result, rank: index + 1 }));

  const ineligible = results.filter((result) => !result.eligible);
  const first = institutions[0];
  const maxDti = first?.criteria?.maxDtiRatio ?? 0.4;
  const salary = first?.monthlyNetSalary ?? 0;
  const existing = first?.existingMonthlyRepayments ?? 0;

  return {
    ranked,
    ineligible,
    profileSummary: {
      salary,
      existingRepayments: existing,
      availableRepaymentCapacity: Math.max(0, salary * maxDti - existing),
      employmentCategory: first?.employmentCategory ?? '',
    },
  };
}

function buildResult(
  p: CheckInstitutionParams,
  reason: string,
  maxLoanAmount = 0,
): InstitutionEligibilityResult {
  const installment = calculateMonthlyInstallment(
    p.requestedAmount,
    p.criteria.interestRate,
    p.requestedTermMonths,
  );

  return {
    institutionId: p.institutionId,
    institutionName: p.institutionName,
    institutionType: p.institutionType,
    eligible: false,
    ineligibilityReason: reason,
    maxLoanAmount: Math.round(maxLoanAmount),
    requestedAmount: p.requestedAmount,
    requestedAmountEligible: false,
    estimatedMonthlyInstallment: Math.round(installment),
    totalRepayable: Math.round(installment * p.requestedTermMonths),
    processingFee: Math.round(
      p.requestedAmount * (p.criteria.processingFeePercent / 100),
    ),
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

function buildRequestedAmountReason(
  requestedAmount: number,
  maxLoanAmount: number,
  dtiIfApproved: number,
  maxDtiRatio: number,
): string {
  const maxDtiPercent = maxDtiRatio * 100;

  if (requestedAmount > maxLoanAmount) {
    return `Requested amount is above this lender's estimated maximum of MK ${Math.round(maxLoanAmount).toLocaleString()}.`;
  }

  return `Estimated repayment would push DTI to ${dtiIfApproved.toFixed(1)}%, above this lender's ${maxDtiPercent.toFixed(0)}% limit.`;
}

function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    civil_servant: 'civil servant',
    private_sector: 'private sector',
    self_employed: 'self-employed',
    sacco_member: 'SACCO member',
  };
  return labels[category] ?? category;
}
