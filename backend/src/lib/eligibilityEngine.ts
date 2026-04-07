export interface EligibilityInput {
  monthlySalary: number;
  employmentType: "CIVIL" | "PRIVATE" | string;
  employmentYears?: number;
  age?: number;
  housingStatus?: string;
  existingLoanAmount: number; // monthly repayment on existing loans
  bankingYears?: number;
  loanAmount: number;
  durationMonths: number;
  interestRate?: number; // annual interest rate
  institutionId?: number;
}

export interface InstitutionCriteriaInput {
  id: number;
  institutionId: number;
  institution: { name: string };
  maxDtiRatio: number;
  minNetSalary: number;
  maxLoanMultiplier: number;
}

export interface EligibilityResult {
  eligible: boolean;
  riskScore: number;
  riskCategory: "LOW_RISK" | "MODERATE_RISK" | "HIGH_RISK";
  dtiRatio: number;
  monthlyInstallment: number;
  totalRepayable: number;
  maxLoanAmount: number;
  breakdown: {
    employment?: number;
    employmentYears?: number;
    age?: number;
    housing?: number;
    banking?: number;
    total: number;
    maxPossible: number;
  };
  reasons: string[];
  recommendations: string[];
  institutionInfo?: {
    id: number;
    name: string;
    maxDti: number;
    minSalary: number;
  };
}

export function calculateMonthlyInstallment(
  principal: number,
  annualRate: number,
  months: number
): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export function assessEligibility(
  input: EligibilityInput, 
  criteria: InstitutionCriteriaInput
): EligibilityResult {
  const ANNUAL_RATE = input.interestRate ?? 24; // Default to 24% if not provided
  const reasons: string[] = [];
  const recommendations: string[] = [];

  // 1. Calculate Monthly Installment of NEW loan
  const monthlyInstallment = calculateMonthlyInstallment(input.loanAmount, ANNUAL_RATE, input.durationMonths);
  
  // 2. Calculate DTI Ratio
  const totalMonthlyDebt = input.existingLoanAmount + monthlyInstallment;
  const dtiRatio = (totalMonthlyDebt / input.monthlySalary) * 100;

  // 3. Define Risk Category (Based on Doc Module 9.2)
  let riskCategory: EligibilityResult["riskCategory"];
  if (dtiRatio > 33) riskCategory = "HIGH_RISK";
  else if (dtiRatio >= 20) riskCategory = "MODERATE_RISK";
  else riskCategory = "LOW_RISK";

  // 4. Eligibility Gates (Based on Doc Module 9.3)
  let eligible = true;

  // Rule 1: Net Salary check
  if (input.monthlySalary < criteria.minNetSalary) {
    eligible = false;
    reasons.push(`${criteria.institution.name} requires a minimum net salary of MK ${criteria.minNetSalary.toLocaleString()}.`);
  }

  // Rule 2: Max DTI check
  if (dtiRatio > criteria.maxDtiRatio) {
    eligible = false;
    reasons.push(`Projected DTI [${dtiRatio.toFixed(1)}%] exceeds ${criteria.institution.name}'s threshold of ${criteria.maxDtiRatio}%.`);
  }

  // Rule 3: Loan Multiplier check
  const maxMultiplierLoan = input.monthlySalary * criteria.maxLoanMultiplier;
  if (input.loanAmount > maxMultiplierLoan) {
    eligible = false;
    reasons.push(`Requested amount MK ${input.loanAmount.toLocaleString()} exceeds the maximum allowed multiplier for your salary (MK ${maxMultiplierLoan.toLocaleString()}).`);
  }

  // 5. Max Affordable Loan Amount (Based on Doc Module 9.1)
  const maxMonthlyRepayment = (input.monthlySalary * (criteria.maxDtiRatio / 100));
  const availableCapacity = Math.max(0, maxMonthlyRepayment - input.existingLoanAmount);
  
  // Calculate principal from affordable monthly payment
  const r = ANNUAL_RATE / 100 / 12;
  const maxLoanByDti = availableCapacity > 0
    ? (availableCapacity * (Math.pow(1 + r, input.durationMonths) - 1)) / (r * Math.pow(1 + r, input.durationMonths))
    : 0;
  
  const maxLoanAmount = Math.min(maxLoanByDti, maxMultiplierLoan);

  // Legacy Score Components (kept for UI compatibility but simplified)
  const totalScore = (eligible ? 80 : 40) + (dtiRatio < 20 ? 40 : dtiRatio < 33 ? 20 : 0);

  return {
    eligible,
    riskScore: totalScore,
    riskCategory,
    dtiRatio,
    monthlyInstallment,
    totalRepayable: monthlyInstallment * input.durationMonths,
    maxLoanAmount,
    breakdown: {
      total: totalScore,
      maxPossible: 120,
    },
    reasons,
    recommendations: riskCategory === "LOW_RISK" ? ["Strong profile. High likelihood of approval."] : [],
    institutionInfo: {
      id: criteria.institutionId,
      name: criteria.institution.name,
      maxDti: criteria.maxDtiRatio,
      minSalary: criteria.minNetSalary,
    },
  };
}

export function simulateAllInstitutions(
  input: EligibilityInput, 
  allCriteria: InstitutionCriteriaInput[]
) {
  return allCriteria.map(criteria => {
    const res = assessEligibility(input, criteria);
    return {
      institutionId: criteria.institutionId,
      bank: criteria.institution.name,
      eligible: res.eligible,
      maxAmount: res.maxLoanAmount,
      riskLevel: res.riskCategory,
      rate: 24 // Can be expanded in future
    };
  });
}
