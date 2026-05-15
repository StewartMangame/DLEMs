import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialProfile } from '../../entities/financial-profile.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(FinancialProfile)
    private profileRepo: Repository<FinancialProfile>,
  ) {}

  async getProfile(userId: number) {
    const profile = await this.profileRepo.findOne({
      where: { userId },
      relations: ['salaryInstitution'],
    });
    return { profile };
  }

  async updateProfile(userId: number, data: any) {
    let profile: FinancialProfile | null = await this.profileRepo.findOne({
      where: { userId },
    });
    if (!profile) {
      const newProfile = new FinancialProfile();
      newProfile.userId = userId;
      Object.assign(newProfile, data);
      profile = await this.profileRepo.save(newProfile);
    } else {
      Object.assign(profile, data);
      profile = await this.profileRepo.save(profile);
    }
    return { success: true, profile };
  }
}
