import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';

type ContentStatus = 'placeholder' | 'translated' | 'needs_review';

export class CreateContentDto {
  @IsString()
  @MinLength(1, { message: 'Content key cannot be empty' })
  key: string;

  @IsString()
  @MinLength(1, { message: 'English text cannot be empty' })
  english: string;

  @IsOptional()
  @IsString()
  chichewa?: string;

  @IsOptional()
  @IsEnum(['placeholder', 'translated', 'needs_review'])
  status?: ContentStatus;
}

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  english?: string;

  @IsOptional()
  @IsString()
  chichewa?: string;

  @IsOptional()
  @IsEnum(['placeholder', 'translated', 'needs_review'])
  status?: ContentStatus;
}
