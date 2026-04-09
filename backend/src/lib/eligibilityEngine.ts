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
 * Formula: [P x R x (1+R)^N]/[(1+R)^N-1]
 */
export function calculateMonthlyInstallment(amount: number, annualRate: number, months: number): number {
  if (annualRate === 0) return amount / months;
  
  const monthlyRate = annualRate / 100 / 12;
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  
  if (denominator === 0) return amount / months;
  
  const installment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / denominator;
  return installment;
}

export function calculateDtiRatio(monthlySalary: number, existingLoanRepayments: number, newLoanInstallment: number): number {
  if (monthlySalary === 0) return 0;
  return ((existingLoanRepayments + newLoanInstallment) / monthlySalary) * 100;
}
