import { IsString, IsOptional, IsDateString, IsEnum, MinLength, IsNumber } from 'class-validator';

type AnnouncementStatus = 'draft' | 'active' | 'expired';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(1, { message: 'English message cannot be empty' })
  messageEnglish: string;

  @IsOptional()
  @IsString()
  messageChichewa?: string;

  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid ISO date string' })
  startDate?: string;

  @IsDateString({}, { message: 'expiryDate must be a valid ISO date string' })
  expiryDate: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'expired'])
  status?: AnnouncementStatus;

  @IsOptional()
  @IsNumber()
  institutionId?: number;
}

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  messageEnglish?: string;

  @IsOptional()
  @IsString()
  messageChichewa?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'expired'])
  status?: AnnouncementStatus;

  @IsOptional()
  @IsNumber()
  institutionId?: number;
}
