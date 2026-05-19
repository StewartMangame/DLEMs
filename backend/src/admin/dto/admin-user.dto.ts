import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsEnum,
  MinLength,
} from 'class-validator';

type AdminRole = 'super_admin' | 'content_admin';

export class CreateAdminDto {
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  fullName: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  /**
   * Plain-text password — will be hashed by bcrypt in the service before storage.
   * Never stored as plain text.
   */
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsEnum(['super_admin', 'content_admin'], {
    message: 'Role must be either super_admin or content_admin',
  })
  role: AdminRole;
}

export class UpdateAdminDto {
  @IsOptional()
  @IsEnum(['super_admin', 'content_admin'])
  role?: AdminRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
