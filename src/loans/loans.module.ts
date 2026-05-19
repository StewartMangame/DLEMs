import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from '../entities/loan.entity';
import { LoanApplication } from '../entities/loan-application.entity';
import { Institution } from '../entities/institution.entity';
import { FinancialProfile } from '../entities/financial-profile.entity';
import { Reminder } from '../entities/reminder.entity';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, LoanApplication, Institution, FinancialProfile, Reminder])],
  controllers: [LoansController],
  providers: [LoansService],
})
export class LoansModule {}
