import { User } from './user.entity';
import { Institution } from './institution.entity';
import { LoanApplication } from './loan-application.entity';
import { Reminder } from './reminder.entity';
export declare class Loan {
    id: number;
    userId: number;
    user: User;
    providerInstitutionId: number;
    providerInstitution: Institution;
    loanAmount: number;
    monthlyDeduction: number;
    loanTermMonths: number;
    startDate: Date;
    remainingBalance: number;
    paidMonths: number;
    isActive: boolean;
    applicationId: number;
    application: LoanApplication;
    reminders: Reminder[];
    createdAt: Date;
    updatedAt: Date;
}
