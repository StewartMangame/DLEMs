import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';

type SaccoStatus = 'active' | 'inactive' | 'coming_soon';

export class CreateSaccoDto {
  @IsString()
  @MinLength(2, { message: 'SACCO name must be at least 2 characters' })
  name: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'coming_soon'], {
    message: 'Status must be active, inactive, or coming_soon',
  })
  status?: SaccoStatus;
}

export class UpdateSaccoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'coming_soon'])
  status?: SaccoStatus;
}
