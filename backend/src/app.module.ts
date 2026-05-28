import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminActivityLog } from './entities/admin-activity-log.entity';
import { AdminUser } from './entities/admin-user.entity';
import { Announcement } from './entities/announcement.entity';
import { ContentString } from './entities/content-string.entity';
import { EligibilityCheckLog } from './entities/eligibility-check-log.entity';
import { FinancialProfile } from './entities/financial-profile.entity';
import { InstitutionCriteria } from './entities/institution-criteria.entity';
import { Institution } from './entities/institution.entity';
import { LoanApplication } from './entities/loan-application.entity';
import { LoanProduct } from './entities/loan-product.entity';
import { Loan } from './entities/loan.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { Otp } from './entities/otp.entity';
import { Reminder } from './entities/reminder.entity';
import { Sacco } from './entities/sacco.entity';
import { User } from './entities/user.entity';

// ── Admin modules ────────────────────────────────────────────────────────────
import { AdminPanelModule } from './admin/admin-panel.module';
import { AdminModule } from './admin/admin.module';

import { AnnouncementsModule } from './announcements/announcements.module';
import { AuthModule } from './auth/auth.module';
import { ContentStringsModule } from './content-strings/content-strings.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EligibilityModule } from './eligibility/eligibility.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { InstitutionsService } from './institutions/institutions.service';
import { LoansModule } from './loans/loans.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProfileModule } from './profile/profile.module';
import { ReminderModule } from './reminder/reminder.module';

import { dataSourceOptions } from './data-source';

// ── Root ─────────────────────────────────────────────────────────────────────
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get<string>('NODE_ENV') === 'production';
        const databaseUrl = config.get<string>('POSTGRES_URL') || config.get<string>('DATABASE_URL');

        return {
          ...dataSourceOptions,
          ...(databaseUrl ? { url: databaseUrl } : {}),
          synchronize: !isProduction && config.get<string>('TYPEORM_SYNC', 'true') === 'true',
        } as any;
      },
    }),

    ScheduleModule.forRoot(),
    AuthModule,
    ProfileModule,
    LoansModule,
    InstitutionsModule,
    EligibilityModule,
    ReminderModule,
    NotificationsModule,
    AnnouncementsModule,
    ContentStringsModule,
    AdminModule,
    AdminPanelModule,
    DashboardModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly instService: InstitutionsService) {}

  async onModuleInit() {
    await this.instService.seedDefaultInstitutions();
  }
}
