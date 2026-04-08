import { Module } from '@nestjs/common';
import { EligibilityController } from './eligibility.controller';
import { EligibilityService } from './eligibility.service';
import { InstitutionsModule } from '../institutions/institutions.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialProfile } from '../entities/financial-profile.entity';
import { Institution } from '../entities/institution.entity';

@Module({
  imports: [InstitutionsModule, TypeOrmModule.forFeature([FinancialProfile, Institution])],
  controllers: [EligibilityController],
  providers: [EligibilityService],
})
export class EligibilityModule {}
