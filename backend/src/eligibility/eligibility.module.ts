import { Module } from '@nestjs/common';
import { EligibilityController } from './eligibility.controller';
import { EligibilityService } from './eligibility.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Institution } from '../entities/institution.entity';
import { LoanProduct } from '../entities/loan-product.entity';
import { Sacco } from '../entities/sacco.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Institution, LoanProduct, Sacco])],
  controllers: [EligibilityController],
  providers: [EligibilityService],
})
export class EligibilityModule {}
