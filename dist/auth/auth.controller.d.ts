import { AuthService } from './auth.service';
import type { Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: any, res: Response): Promise<{
        access_token: string;
        role: string;
        user: {
            id: number;
            fullName: string;
            nationalId: string;
            employeeNumber: string;
            phone: string;
            email: string;
            role: string;
            isInstitutionAdmin: boolean;
            institutionId: number;
            institution: import("../entities/institution.entity").Institution;
            bank: string;
            department: string;
            createdAt: Date;
            updatedAt: Date;
            profile: import("../entities/financial-profile.entity").FinancialProfile;
            applications: import("../entities/loan-application.entity").LoanApplication[];
            activeLoans: import("../entities/loan.entity").Loan[];
            reminders: import("../entities/reminder.entity").Reminder[];
        };
    }>;
    register(body: any, res: Response): Promise<{
        access_token: string;
        role: string;
        user: {
            id: number;
            fullName: string;
            nationalId: string;
            employeeNumber: string;
            phone: string;
            email: string;
            role: string;
            isInstitutionAdmin: boolean;
            institutionId: number;
            institution: import("../entities/institution.entity").Institution;
            bank: string;
            department: string;
            createdAt: Date;
            updatedAt: Date;
            profile: import("../entities/financial-profile.entity").FinancialProfile;
            applications: import("../entities/loan-application.entity").LoanApplication[];
            activeLoans: import("../entities/loan.entity").Loan[];
            reminders: import("../entities/reminder.entity").Reminder[];
        };
    }>;
    logout(res: Response): Promise<{
        success: boolean;
    }>;
    me(req: any): Promise<{
        user: import("../entities/user.entity").User;
    }>;
}
