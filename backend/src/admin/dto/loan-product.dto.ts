import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(2, { message: 'Product name must be at least 2 characters' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minTermMonths?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTermMonths?: number;

  @IsOptional()
  @IsString()
  repaymentPeriods?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  insuranceFeePercent?: number;

  @IsOptional()
  @IsString()
  collateralRequirements?: string;

  @IsOptional()
  @IsString()
  conditions?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'coming_soon'])
  status?: 'active' | 'inactive' | 'coming_soon';
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minTermMonths?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTermMonths?: number;

  @IsOptional()
  @IsString()
  repaymentPeriods?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  insuranceFeePercent?: number;

  @IsOptional()
  @IsString()
  collateralRequirements?: string;

  @IsOptional()
  @IsString()
  conditions?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'coming_soon'])
  status?: 'active' | 'inactive' | 'coming_soon';
}
