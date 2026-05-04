import { EligibilityService } from './eligibility.service';
export declare class EligibilityController {
    private readonly eligibilityService;
    constructor(eligibilityService: EligibilityService);
    getInstitutions(): Promise<{
        id: number;
        name: string;
        type: string;
        criteria: {
            interestRate: number;
            minNetSalary: number;
            maxDtiRatio: number;
            minRepaymentMonths: number;
            maxRepaymentMonths: number;
            processingFeePercent: number;
            requiresGuarantor: boolean;
            requiresPayslip: boolean;
            eligibleEmploymentTypes: string[];
            civilServantMultiplier: number;
            privateMultiplier: number;
            selfEmployedMultiplier: number;
            saccoMemberMultiplier: number;
            notes: string;
        };
    }[]>;
    compareInstitutions(body: {
        monthlyNetSalary: number;
        existingMonthlyRepayments: number;
        employmentCategory: string;
        requestedAmount: number;
        requestedTermMonths: number;
        institutionIds?: number[];
    }): Promise<import("../lib/eligibilityEngine").CompareResult>;
    checkEligibility(body: any): Promise<{
        result: import("../lib/eligibilityEngine").InstitutionEligibilityResult | null;
        bankSimulations: import("../lib/eligibilityEngine").InstitutionEligibilityResult[];
    }>;
}
