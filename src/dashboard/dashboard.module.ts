import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { User } from '../entities/user.entity';
import { Loan } from '../entities/loan.entity';
import { LoanApplication } from '../entities/loan-application.entity';
import { FinancialProfile } from '../entities/financial-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Loan, LoanApplication, FinancialProfile])],
  controllers: [DashboardController],
})
export class DashboardModule {}
