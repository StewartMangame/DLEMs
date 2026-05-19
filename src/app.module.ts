import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { User } from './entities/user.entity';
import { Institution } from './entities/institution.entity';
import { InstitutionCriteria } from './entities/institution-criteria.entity';
import { FinancialProfile } from './entities/financial-profile.entity';
import { Loan } from './entities/loan.entity';
import { LoanApplication } from './entities/loan-application.entity';
import { Reminder } from './entities/reminder.entity';
import { NotificationLog } from './entities/notification-log.entity';

import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { LoansModule } from './loans/loans.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { EligibilityModule } from './eligibility/eligibility.module';
import { ReminderModule } from './reminder/reminder.module';
import { AdminModule } from './admin/admin.module';
import { DashboardModule } from './dashboard/dashboard.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InstitutionsService } from './institutions/institutions.service';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'loan_db.sqlite',
      entities: [
        User, Institution, InstitutionCriteria, FinancialProfile,
        Loan, LoanApplication, Reminder, NotificationLog
      ],
      synchronize: true, // For development, automatically sync entity schemas
    }),
    ScheduleModule.forRoot(),
    AuthModule, ProfileModule, LoansModule, InstitutionsModule,
    EligibilityModule, ReminderModule, AdminModule, DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly instService: InstitutionsService,
    private readonly authService: AuthService,
  ) {}

  async onModuleInit() {
    await this.instService.seedDefaultInstitutions();
    await this.authService.seedAdmin();
  }
}
