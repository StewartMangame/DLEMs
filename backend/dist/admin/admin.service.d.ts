import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Institution } from '../entities/institution.entity';
import { InstitutionCriteria } from '../entities/institution-criteria.entity';
import { LoanApplication } from '../entities/loan-application.entity';
export declare class AdminService {
    private userRepo;
    private instRepo;
    private criteriaRepo;
    private appRepo;
    constructor(userRepo: Repository<User>, instRepo: Repository<Institution>, criteriaRepo: Repository<InstitutionCriteria>, appRepo: Repository<LoanApplication>);
    getApplications(currentUser: any, statusFilter?: string): Promise<{
        applications: {
            user: User | {
                fullName: string;
                employeeNumber: string;
            };
            id: number;
            userId: number;
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
            loan: import("../entities/loan.entity").Loan;
        }[];
    }>;
    getApplication(id: number): Promise<{
        application: LoanApplication;
    }>;
    reviewApplication(currentUser: any, id: number, data: any): Promise<{
        success: boolean;
        application: LoanApplication;
    }>;
    getStats(currentUser: any): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        active: number;
    }>;
    createInstitution(data: any): Promise<{
        success: boolean;
        institution: Institution;
    }>;
    assignAdmin(userId: number, institutionId: number): Promise<{
        success: boolean;
        user: User;
    }>;
    updateCriteria(institutionId: number, data: any): Promise<{
        success: boolean;
        criteria: InstitutionCriteria;
    }>;
}
