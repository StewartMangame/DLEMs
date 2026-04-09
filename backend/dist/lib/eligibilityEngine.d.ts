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
export declare function calculateMonthlyInstallment(amount: number, annualRate: number, months: number): number;
export declare function calculateDtiRatio(monthlySalary: number, existingLoanRepayments: number, newLoanInstallment: number): number;
