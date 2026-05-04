import { Repository } from 'typeorm';
import { Loan } from '../entities/loan.entity';
import { LoanApplication } from '../entities/loan-application.entity';
import { FinancialProfile } from '../entities/financial-profile.entity';
import { Reminder } from '../entities/reminder.entity';
export declare class LoansService {
    private loanRepo;
    private appRepo;
    private profileRepo;
    private reminderRepo;
    constructor(loanRepo: Repository<Loan>, appRepo: Repository<LoanApplication>, profileRepo: Repository<FinancialProfile>, reminderRepo: Repository<Reminder>);
    getUserLoans(userId: number): Promise<{
        loans: Loan[];
        applications: LoanApplication[];
    }>;
    createManualLoan(userId: number, data: any): Promise<Loan>;
    getRepaymentSchedule(userId: number, loanId: number): Promise<{
        loan: Loan;
        schedule: {
            month: number;
            installment: number;
            principal: number;
            interest: number;
            balance: number;
            isPaid: boolean;
        }[];
    }>;
    applyLoan(userId: number, data: any): Promise<LoanApplication>;
    repayLoan(userId: number, loanId: number): Promise<Loan>;
    private scheduleReminders;
}
