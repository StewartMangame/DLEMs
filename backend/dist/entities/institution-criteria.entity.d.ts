import { Institution } from './institution.entity';
export declare class InstitutionCriteria {
    id: number;
    institutionId: number;
    institution: Institution;
    maxDtiRatio: number;
    minNetSalary: number;
    maxLoanMultiplier: number;
    updatedAt: Date;
}
