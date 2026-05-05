export type EmploymentCategory = 'civil_servant' | 'private_sector' | 'self_employed' | 'sacco_member';
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
export declare function calculateMonthlyInstallment(amount: number, annualRate: number, months: number): number;
export declare function calculateMaxPrincipal(maxMonthlyPayment: number, annualRate: number, months: number): number;
export declare function getMultiplier(category: EmploymentCategory, criteria: InstitutionCriteriaData): number;
export declare function calculateDtiRatio(monthlySalary: number, existingRepayments: number, newInstallment: number): number;
export declare function checkInstitution(p: CheckInstitutionParams): InstitutionEligibilityResult;
export declare function rankInstitutions(institutions: CheckInstitutionParams[]): CompareResult;
