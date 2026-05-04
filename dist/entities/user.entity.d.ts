import { FinancialProfile } from './financial-profile.entity';
import { LoanApplication } from './loan-application.entity';
import { Loan } from './loan.entity';
import { Reminder } from './reminder.entity';
import { Institution } from './institution.entity';
export declare class User {
    id: number;
    fullName: string;
    nationalId: string;
    employeeNumber: string;
    phone: string;
    email: string;
    passwordHash: string;
    role: string;
    isInstitutionAdmin: boolean;
    institutionId: number;
    institution: Institution;
    bank: string;
    department: string;
    createdAt: Date;
    updatedAt: Date;
    profile: FinancialProfile;
    applications: LoanApplication[];
    activeLoans: Loan[];
    reminders: Reminder[];
}
