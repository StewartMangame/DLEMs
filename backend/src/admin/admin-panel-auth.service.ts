import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AdminUser } from '../entities/admin-user.entity';

@Injectable()
export class AdminPanelAuthService {
  private readonly logger = new Logger(AdminPanelAuthService.name);

  constructor(
    @InjectRepository(AdminUser) private adminRepo: Repository<AdminUser>,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const cleanEmail = email.toLowerCase().trim();

    const admin = await this.adminRepo.findOne({
      where: { email: cleanEmail, isActive: true },
    });
    if (!admin) {
      throw new UnauthorizedException('Invalid admin credentials');
    }
    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid admin credentials');
    }
    admin.lastLoginAt = new Date();
    await this.adminRepo.save(admin);
    const token = this.jwt.sign({
      sub: admin.id,
      role: admin.role,
      type: 'admin',
    });
    const { passwordHash, ...safe } = admin;
    return { access_token: token, admin: safe };
  }

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

    const existing = await this.adminRepo.findOne({ where: { email } });
    if (existing) return;
    const admin = this.adminRepo.create({
      fullName: 'DLEM Super Administrator',
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'super_admin',
      isActive: true,
    });
    await this.adminRepo.save(admin);
    this.logger.log(`Super admin seeded for ${email}.`);
  }
}
