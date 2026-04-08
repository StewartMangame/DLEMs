import { EligibilityService } from './eligibility.service';
export declare class EligibilityController {
    private readonly eligibilityService;
    constructor(eligibilityService: EligibilityService);
    checkEligibility(body: any): Promise<{
        result: {
            eligible: boolean;
            monthlyInstallment: number;
            totalRepayable: any;
            dtiRatio: number;
            maxLoanAmount: number;
            riskScore: number;
            riskCategory: string;
            breakdown: {
                employment: number;
                employmentYears: number;
                age: number;
                housing: number;
                banking: number;
            };
        };
        bankSimulations: {
            institutionId: number;
            bank: string;
            eligible: boolean;
            maxAmount: number;
            riskLevel: string;
            rate: number;
        }[];
    }>;
}
