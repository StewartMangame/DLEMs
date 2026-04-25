import { Module } from '@nestjs/common';
import { EligibilityController } from './eligibility.controller';
import { EligibilityService } from './eligibility.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Institution } from '../entities/institution.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Institution])],
  controllers: [EligibilityController],
  providers: [EligibilityService],
})
export class EligibilityModule {}
