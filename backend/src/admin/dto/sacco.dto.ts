import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';

type SaccoStatus = 'active' | 'inactive';

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
  @IsEnum(['active', 'inactive'], {
    message: 'Status must be active or inactive',
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
  @IsEnum(['active', 'inactive'])
  status?: SaccoStatus;
}
