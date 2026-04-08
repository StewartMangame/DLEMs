import { Repository } from 'typeorm';
import { FinancialProfile } from '../entities/financial-profile.entity';
import { Institution } from '../entities/institution.entity';
export declare class EligibilityService {
    private profileRepo;
    private instRepo;
    constructor(profileRepo: Repository<FinancialProfile>, instRepo: Repository<Institution>);
    checkEligibility(params: any): Promise<{
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
