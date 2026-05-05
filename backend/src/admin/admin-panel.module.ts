import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminUser } from '../entities/admin-user.entity';
import { AdminActivityLog } from '../entities/admin-activity-log.entity';
import { Institution } from '../entities/institution.entity';
import { InstitutionCriteria } from '../entities/institution-criteria.entity';
import { Sacco } from '../entities/sacco.entity';
import { LoanProduct } from '../entities/loan-product.entity';
import { ContentString } from '../entities/content-string.entity';
import { Announcement } from '../entities/announcement.entity';
import { EligibilityCheckLog } from '../entities/eligibility-check-log.entity';
import { User } from '../entities/user.entity';
import { Loan } from '../entities/loan.entity';
import { AdminPanelController } from './admin-panel.controller';
import { AdminPanelService } from './admin-panel.service';
import { AdminPanelAuthController } from './admin-panel-auth.controller';
import { AdminPanelAuthService } from './admin-panel-auth.service';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('ADMIN_JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      AdminUser,
      AdminActivityLog,
      Institution,
      InstitutionCriteria,
      Sacco,
      LoanProduct,
      ContentString,
      Announcement,
      EligibilityCheckLog,
      User,
      Loan,
    ]),
  ],
  controllers: [AdminPanelController, AdminPanelAuthController],
  providers: [AdminPanelService, AdminPanelAuthService, AdminJwtStrategy],
  exports: [AdminPanelService],
})
export class AdminPanelModule implements OnModuleInit {
  constructor(private readonly authSvc: AdminPanelAuthService) {}
  async onModuleInit() {
    await this.authSvc.seedSuperAdmin();
  }
}
