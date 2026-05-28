import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AdminUser } from '../entities/admin-user.entity';

@Injectable()
export class AdminPanelAuthService {
  private readonly logger = new Logger(AdminPanelAuthService.name);

  constructor(
    @InjectRepository(AdminUser) private adminRepo: Repository<AdminUser>,
    private config: ConfigService,
  ) {}

  async validateById(id: number): Promise<AdminUser | null> {
    return this.adminRepo.findOne({ where: { id, isActive: true } });
  }

  async seedSuperAdmin() {
    const email = this.config.get<string>('ADMIN_SEED_EMAIL');
    const password = this.config.get<string>('ADMIN_SEED_PASSWORD');

    if (!email || !password) {
      this.logger.warn(
        'Skipping super admin seed because ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD is not configured.',
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const existing = await this.adminRepo.findOne({ where: { email } });

    if (existing) {
      // Update password to match .env if it already exists
      existing.passwordHash = passwordHash;
      await this.adminRepo.save(existing);
      this.logger.log(`Super admin credentials synced for ${email}.`);
      return;
    }

    const admin = this.adminRepo.create({
      fullName: 'DLEM Super Administrator',
      email,
      passwordHash,
      role: 'super_admin',
      isActive: true,
    });
    await this.adminRepo.save(admin);
    this.logger.log(`Super admin seeded for ${email}.`);
  }
}
