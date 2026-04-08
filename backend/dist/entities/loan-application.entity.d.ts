import { User } from './user.entity';
import { Institution } from './institution.entity';
import { Loan } from './loan.entity';
export declare class LoanApplication {
    id: number;
    userId: number;
    user: User;
    institutionId: number;
    institution: Institution;
    amount: number;
    purpose: string;
    durationMonths: number;
    monthlyInstallment: number;
    riskScore: number;
    riskCategory: string;
    dtiRatio: number;
    status: string;
    createdAt: Date;
    loan: Loan;
}
