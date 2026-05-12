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
import { Reminder } from './entities/reminder.entity';
import { Sacco } from './entities/sacco.entity';
import { User } from './entities/user.entity';

// ── Admin modules ────────────────────────────────────────────────────────────
import { AdminPanelModule } from './admin/admin-panel.module';
import { AdminModule } from './admin/admin.module';

// ── User modules ─────────────────────────────────────────────────────────────
import { AuthModule } from './user/auth/auth.module';
import { DashboardModule } from './user/dashboard/dashboard.module';
import { EligibilityModule } from './user/eligibility/eligibility.module';
import { InstitutionsModule } from './user/institutions/institutions.module';
import { InstitutionsService } from './user/institutions/institutions.service';
import { LoansModule } from './user/loans/loans.module';
import { ProfileModule } from './user/profile/profile.module';
import { ReminderModule } from './user/reminder/reminder.module';

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
      useFactory: (config: ConfigService) => ({
        type: 'sqlite',
        database: config.get<string>('SQLITE_DB_PATH', 'loan_db.sqlite'),
        entities: [
          User,
          Institution,
          InstitutionCriteria,
          FinancialProfile,
          Loan,
          LoanApplication,
          Reminder,
          NotificationLog,
          AdminUser,
          AdminActivityLog,
          Sacco,
          LoanProduct,
          ContentString,
          Announcement,
          EligibilityCheckLog,
        ],
        synchronize: config.get<string>('TYPEORM_SYNC', 'true') === 'true',
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    ProfileModule,
    LoansModule,
    InstitutionsModule,
    EligibilityModule,
    ReminderModule,
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
