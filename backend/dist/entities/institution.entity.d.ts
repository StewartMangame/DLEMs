import { InstitutionCriteria } from './institution-criteria.entity';
import { User } from './user.entity';
import { Loan } from './loan.entity';
import { FinancialProfile } from './financial-profile.entity';
import { LoanApplication } from './loan-application.entity';
export declare class Institution {
    id: number;
    name: string;
    type: string;
    isActive: boolean;
    createdAt: Date;
    criteria: InstitutionCriteria;
    admins: User[];
    loans: Loan[];
    profiles: FinancialProfile[];
    applications: LoanApplication[];
}
