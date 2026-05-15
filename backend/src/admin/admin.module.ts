import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../entities/user.entity';
import { Institution } from '../entities/institution.entity';
import { InstitutionCriteria } from '../entities/institution-criteria.entity';
import { LoanApplication } from '../entities/loan-application.entity';
import { Loan } from '../entities/loan.entity';
import { FinancialProfile } from '../entities/financial-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Institution,
      InstitutionCriteria,
      LoanApplication,
      Loan,
      FinancialProfile,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
