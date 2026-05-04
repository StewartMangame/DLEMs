import { User } from './user.entity';
import { Institution } from './institution.entity';
export declare class FinancialProfile {
    id: number;
    userId: number;
    user: User;
    employerName: string;
    employmentCategory: string;
    employmentType: string;
    monthlyNetSalary: number;
    salaryInstitutionId: number;
    salaryInstitution: Institution;
    employmentYears: number;
    age: number;
    housingStatus: string;
    existingLoanAmount: number;
    totalBorrowedAmount: number;
    bankingYears: number;
    createdAt: Date;
    updatedAt: Date;
}
