import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialProfile } from '../entities/financial-profile.entity';
import { User } from '../entities/user.entity';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { InstitutionsModule } from '../institutions/institutions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialProfile, User]),
    InstitutionsModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
