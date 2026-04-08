import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Loan } from '../entities/loan.entity';
import { LoanApplication } from '../entities/loan-application.entity';
import { FinancialProfile } from '../entities/financial-profile.entity';
export declare class DashboardController {
    private userRepo;
    private loanRepo;
    private appRepo;
    private profileRepo;
    constructor(userRepo: Repository<User>, loanRepo: Repository<Loan>, appRepo: Repository<LoanApplication>, profileRepo: Repository<FinancialProfile>);
    getDashboard(req: any): Promise<{
        user: User;
        profile: FinancialProfile;
        activeLoans: Loan[];
        applications: LoanApplication[];
    }>;
}
