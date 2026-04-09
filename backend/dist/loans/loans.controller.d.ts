import { LoansService } from './loans.service';
export declare class LoansController {
    private readonly loansService;
    constructor(loansService: LoansService);
    getLoans(req: any): Promise<{
        loans: import("../entities/loan.entity").Loan[];
        applications: import("../entities/loan-application.entity").LoanApplication[];
    }>;
    recordLoan(req: any, body: any): Promise<{
        success: boolean;
        loan: import("../entities/loan.entity").Loan;
    }>;
    applyLoan(req: any, body: any): Promise<{
        success: boolean;
        application: import("../entities/loan-application.entity").LoanApplication;
    }>;
    repayLoan(req: any, id: string): Promise<{
        success: boolean;
        loan: import("../entities/loan.entity").Loan;
    }>;
}
