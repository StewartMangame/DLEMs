import { Repository } from 'typeorm';
import { Institution } from '../entities/institution.entity';
import { EmploymentCategory, CompareResult, InstitutionEligibilityResult } from '../lib/eligibilityEngine';
export declare class EligibilityService {
    private instRepo;
    constructor(instRepo: Repository<Institution>);
    compareInstitutions(params: {
        monthlyNetSalary: number;
        existingMonthlyRepayments: number;
        employmentCategory: EmploymentCategory;
        requestedAmount: number;
        requestedTermMonths: number;
        institutionIds?: number[];
    }): Promise<CompareResult>;
    checkEligibility(params: any): Promise<{
        result: InstitutionEligibilityResult | null;
        bankSimulations: InstitutionEligibilityResult[];
    }>;
    getInstitutionsPublic(): Promise<{
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
}
