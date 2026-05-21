import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsArray,
  Min,
  Max,
  IsDateString,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

type InstitutionType = 'bank' | 'sacco' | 'microfinance' | 'other';
type InstitutionStatus = 'active' | 'inactive' | 'pending_verification';

class InstitutionCriteriaDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  maxDtiRatio?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minNetSalary?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  processingFeePercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minRepaymentMonths?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRepaymentMonths?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  civilServantMultiplier?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  privateMultiplier?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  selfEmployedMultiplier?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  saccoMemberMultiplier?: number;

  @IsOptional()
  @IsBoolean()
  requiresGuarantor?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresPayslip?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInstitutionDto {
  @IsString()
  @MinLength(2, { message: 'Institution name must be at least 2 characters' })
  name: string;

  @IsEnum(['bank', 'sacco', 'microfinance', 'other'], {
    message: 'Type must be one of: bank, sacco, microfinance, other',
  })
  type: InstitutionType;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'pending_verification'])
  status?: InstitutionStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isInterestRateFixed?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresCrbCheck?: boolean;

  @IsOptional()
  @IsBoolean()
  collateralAccepted?: boolean;

  @IsOptional()
  @IsString()
  turnaroundTime?: string;

  @IsOptional()
  @IsBoolean()
  reminderAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  digitalApplicationAvailable?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredDocuments?: string[];

  // Criteria fields (flattened on create)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  maxDtiRatio?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minNetSalary?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  processingFeePercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minRepaymentMonths?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRepaymentMonths?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  civilServantMultiplier?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  privateMultiplier?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  selfEmployedMultiplier?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  saccoMemberMultiplier?: number;

  @IsOptional()
  @IsBoolean()
  requiresGuarantor?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresPayslip?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInstitutionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEnum(['bank', 'sacco', 'microfinance', 'other'])
  type?: InstitutionType;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'pending_verification'])
  status?: InstitutionStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isInterestRateFixed?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresCrbCheck?: boolean;

  @IsOptional()
  @IsBoolean()
  collateralAccepted?: boolean;

  @IsOptional()
  @IsString()
  turnaroundTime?: string;

  @IsOptional()
  @IsBoolean()
  reminderAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  digitalApplicationAvailable?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredDocuments?: string[];

  @IsOptional()
  @IsDateString()
  reviewDueDate?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => InstitutionCriteriaDto)
  criteria?: InstitutionCriteriaDto;
}

export class VerifyInstitutionDto {
  @IsOptional()
  @IsDateString(
    {},
    { message: 'reviewDueDate must be a valid ISO date string' },
  )
  reviewDueDate?: string;
}
