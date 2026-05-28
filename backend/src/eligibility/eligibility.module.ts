import { Module } from '@nestjs/common';
import { EligibilityController } from './eligibility.controller';
import { EligibilityService } from './eligibility.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EligibilityCheckLog } from '../entities/eligibility-check-log.entity';
import { Institution } from '../entities/institution.entity';
import { LoanProduct } from '../entities/loan-product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Institution,
      EligibilityCheckLog,
      LoanProduct,
    ]),
  ],
  controllers: [EligibilityController],
  providers: [EligibilityService],
})
export class EligibilityModule {}
