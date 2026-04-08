import { Repository } from 'typeorm';
import { FinancialProfile } from '../entities/financial-profile.entity';
export declare class ProfileService {
    private profileRepo;
    constructor(profileRepo: Repository<FinancialProfile>);
    getProfile(userId: number): Promise<{
        profile: FinancialProfile;
    }>;
    updateProfile(userId: number, data: any): Promise<{
        success: boolean;
        profile: FinancialProfile;
    }>;
}
