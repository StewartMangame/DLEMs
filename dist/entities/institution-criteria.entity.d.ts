import { Institution } from './institution.entity';
export declare class InstitutionCriteria {
    id: number;
    institutionId: number;
    institution: Institution;
    maxDtiRatio: number;
    minNetSalary: number;
    interestRate: number;
    processingFeePercent: number;
    minRepaymentMonths: number;
    maxRepaymentMonths: number;
    civilServantMultiplier: number;
    privateMultiplier: number;
    selfEmployedMultiplier: number;
    saccoMemberMultiplier: number;
    eligibleEmploymentTypes: string[];
    requiresGuarantor: boolean;
    requiresPayslip: boolean;
    notes: string;
    updatedAt: Date;
}
