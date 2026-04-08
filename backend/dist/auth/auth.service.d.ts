import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
export declare class AuthService {
    private userRepository;
    private jwtService;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
    getUserById(id: number): Promise<User>;
    login(loginDto: any): Promise<{
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
    register(registerDto: any): Promise<{
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
}
