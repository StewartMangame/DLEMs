import { Module } from '@nestjs/common';
import { ContentStringsController } from './content-strings.controller';
import { ContentStringsService } from './content-strings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentString } from '../entities/content-string.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContentString])],
  controllers: [ContentStringsController],
  providers: [ContentStringsService],
})
export class ContentStringsModule {}
