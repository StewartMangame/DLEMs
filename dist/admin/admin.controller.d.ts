import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getApplications(req: any, status?: string): Promise<{
        applications: {
            user: import("../entities/user.entity").User | {
                fullName: string;
                employeeNumber: string;
            };
            id: number;
            userId: number;
            institutionId: number;
            institution: import("../entities/institution.entity").Institution;
            amount: number;
            purpose: string;
            durationMonths: number;
            monthlyInstallment: number;
            riskScore: number;
            riskCategory: string;
            dtiRatio: number;
            status: string;
            createdAt: Date;
            loan: import("../entities/loan.entity").Loan;
        }[];
    }>;
    getApplication(id: string): Promise<{
        application: import("../entities/loan-application.entity").LoanApplication;
    }>;
    reviewApplication(req: any, id: string, body: any): Promise<{
        success: boolean;
        application: import("../entities/loan-application.entity").LoanApplication;
    }>;
    createInstitution(req: any, body: any): Promise<{
        success: boolean;
        institution: import("../entities/institution.entity").Institution;
    } | {
        error: string;
    }>;
    assignAdmin(req: any, body: any): Promise<{
        success: boolean;
        user: import("../entities/user.entity").User;
    } | {
        error: string;
    }>;
    updateCriteria(req: any, institutionId: string, body: any): Promise<{
        success: boolean;
        criteria: import("../entities/institution-criteria.entity").InstitutionCriteria;
    }>;
    getStats(req: any): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        active: number;
    }>;
}
