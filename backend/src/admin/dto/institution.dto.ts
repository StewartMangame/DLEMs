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
import { Transform } from 'class-transformer';

type InstitutionType = 'bank' | 'sacco' | 'microfinance' | 'other';
type InstitutionStatus = 'active' | 'inactive' | 'coming_soon';

function normalizeInstitutionType(value: unknown): InstitutionType | unknown {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'commercial_bank' ||
    normalized === 'commercial bank' ||
    normalized === 'bank'
  ) {
    return 'bank';
  }
  if (normalized === 'sacco' || normalized === 'sacco_category') {
    return 'sacco';
  }
  if (normalized === 'microfinance') return 'microfinance';
  if (normalized === 'other') return 'other';
  return normalized;
}

function normalizeInstitutionStatus(value: unknown): InstitutionStatus | unknown {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'coming soon' || normalized === 'coming-soon')
    return 'coming_soon';
  return normalized;
}

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

  @IsOptional()
  @IsArray()
  customCriteria?: any[];
}

export class CreateInstitutionDto {
  @IsString()
  @MinLength(2, { message: 'Institution name must be at least 2 characters' })
  name: string;

  @IsEnum(['bank', 'sacco', 'microfinance', 'other'], {
    message: 'Type must be one of: bank, sacco, microfinance, other',
  })
  @Transform(({ value }) => normalizeInstitutionType(value))
  type: InstitutionType;

  @IsOptional()
  @IsString()
  customInstitutionType?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'coming_soon'])
  @Transform(({ value }) => normalizeInstitutionStatus(value))
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
  @IsArray()
  @IsString({ each: true })
  eligibleEmploymentTypes?: string[];

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
  @Transform(({ value }) => normalizeInstitutionType(value))
  type?: InstitutionType;

  @IsOptional()
  @IsString()
  customInstitutionType?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'coming_soon'])
  @Transform(({ value }) => normalizeInstitutionStatus(value))
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
  @IsBoolean()
  hasBranches?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => InstitutionCriteriaDto)
  criteria?: InstitutionCriteriaDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eligibleEmploymentTypes?: string[];
}

export class VerifyInstitutionDto {
  @IsOptional()
  @IsDateString(
    {},
    { message: 'reviewDueDate must be a valid ISO date string' },
  )
  reviewDueDate?: string;
}
