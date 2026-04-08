import { ProfileService } from './profile.service';
import { InstitutionsService } from '../institutions/institutions.service';
export declare class ProfileController {
    private readonly profileService;
    private readonly instService;
    constructor(profileService: ProfileService, instService: InstitutionsService);
    getProfile(req: any): Promise<{
        profile: import("../entities/financial-profile.entity").FinancialProfile;
    } | {
        profile: {
            employer: string;
            monthlySalary: number;
            bank: string;
            id: number;
            userId: number;
            user: import("../entities/user.entity").User;
            employerName: string;
            employmentType: string;
            monthlyNetSalary: number;
            salaryInstitutionId: number;
            salaryInstitution: import("../entities/institution.entity").Institution;
            employmentYears: number;
            age: number;
            housingStatus: string;
            existingLoanAmount: number;
            totalBorrowedAmount: number;
            bankingYears: number;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    updateProfile(req: any, body: any): Promise<{
        success: boolean;
        profile: import("../entities/financial-profile.entity").FinancialProfile;
    }>;
}
