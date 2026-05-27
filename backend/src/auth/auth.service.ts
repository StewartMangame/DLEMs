import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { User } from '../entities/user.entity';
import { Otp } from '../entities/otp.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    const smtpPort = Number(this.configService.get<string>('SMTP_PORT') || 587);
    const smtpHost = this.cleanConfig('SMTP_HOST') || 'smtp.gmail.com';
    const smtpUser = this.cleanConfig('SMTP_USER');
    const smtpPass = this.cleanConfig('SMTP_PASS').replace(/\s+/g, '');

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
    });
  }

  async onModuleInit() {
    const smtpUser = this.cleanConfig('SMTP_USER');
    const smtpPass = this.cleanConfig('SMTP_PASS').replace(/\s+/g, '');

    if (!smtpUser || !smtpPass) {
      this.logger.error(
        'SMTP is not configured. OTP emails will fail until SMTP_USER and SMTP_PASS are set.',
      );
      return;
    }

    try {
      await this.transporter.verify();
      this.logger.log(`SMTP connection verified for ${smtpUser}.`);
    } catch (error: any) {
      this.logger.error(`SMTP verification failed: ${error.message}`);
    }
  }

  private cleanConfig(key: string): string {
    return (this.configService.get<string>(key) || '')
      .trim()
      .replace(/^['"]|['"]$/g, '');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private getFrontendUrl(): string {
    return (
      this.cleanConfig('FRONTEND_URL') ||
      this.cleanConfig('APP_URL') ||
      'http://localhost:3000'
    ).replace(/\/+$/, '');
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    fallbackText: string;
  }) {
    const from = this.cleanConfig('SMTP_FROM') || '"DLEM" <noreply@dlem.mw>';
    const smtpUser = this.cleanConfig('SMTP_USER');
    const smtpPass = this.cleanConfig('SMTP_PASS').replace(/\s+/g, '');

    if (!smtpUser || !smtpPass) {
      throw new InternalServerErrorException(
        'Email service is not configured. Please set SMTP_USER and SMTP_PASS.',
      );
    }

    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.fallbackText,
        html: options.html,
      });
      this.logger.log(
        `Email "${options.subject}" sent successfully to ${options.to}.`,
      );
    } catch (smtpError: any) {
      this.logger.error(
        `Failed to send "${options.subject}" to ${options.to}: ${smtpError.message}`,
      );
      throw new InternalServerErrorException(
        'Could not send the verification email. Please try again shortly.',
      );
    }
  }

  private isDevOtpEnabled(): boolean {
    return this.configService.get<string>('SHOW_DEV_OTP') === 'true';
  }

  async getUserById(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  private createAuthResponse(user: User) {
    const payload = { sub: user.id, role: user.role };
    const { passwordHash, ...safeUser } = user;

    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
      user: safeUser,
    };
  }

  async login(loginDto: any) {
    const email = this.normalizeEmail(loginDto.email);
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (
      !user ||
      !(await bcrypt.compare(loginDto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email address before signing in.',
      );
    }
    return this.createAuthResponse(user);
  }

  async register(registerDto: any) {
    const email = this.normalizeEmail(registerDto.email);
    // Check if user already exists by email, nationalId, or employeeNumber
    const existing = await this.userRepository.findOne({
      where: [
        { email },
        { nationalId: registerDto.nationalId },
        { employeeNumber: registerDto.employeeNumber },
      ],
    });

    if (existing) {
      if (existing.email === email && !existing.isEmailVerified) {
        // Before updating, ensure new nationalId or employeeNumber aren't taken by OTHER users
        const conflict = await this.userRepository.findOne({
          where: [
            { nationalId: registerDto.nationalId },
            { employeeNumber: registerDto.employeeNumber },
          ],
        });
        if (conflict && conflict.id !== existing.id) {
          if (conflict.nationalId === registerDto.nationalId) {
            throw new BadRequestException('National ID is already registered by another account');
          }
          if (conflict.employeeNumber === registerDto.employeeNumber) {
            throw new BadRequestException('Employee Number is already registered by another account');
          }
        }

        // User exists but is unverified. Update details and send a fresh OTP.
        existing.fullName = registerDto.fullName;
        existing.nationalId = registerDto.nationalId;
        existing.employeeNumber = registerDto.employeeNumber;
        existing.phone = registerDto.phone;
        existing.passwordHash = await bcrypt.hash(registerDto.password, 10);
        existing.isEmailVerified = false;
        await this.userRepository.save(existing);

        const otpCode = await this.generateAndSendOtp(email);
        return {
          message:
            'Account details updated successfully. Please verify the OTP sent to your email.',
          requiresOtp: true,
          devOtp: this.isDevOtpEnabled() ? otpCode : undefined,
        };
      }

      if (existing.email === email) {
        throw new BadRequestException('Email is already registered');
      }
      if (existing.nationalId === registerDto.nationalId) {
        throw new BadRequestException('National ID is already registered');
      }
      if (existing.employeeNumber === registerDto.employeeNumber) {
        throw new BadRequestException('Employee Number is already registered');
      }
    }
    const user = new User();
    user.email = email;
    user.passwordHash = await bcrypt.hash(registerDto.password, 10);
    user.fullName = registerDto.fullName;
    user.nationalId = registerDto.nationalId;
    user.employeeNumber = registerDto.employeeNumber;
    user.phone = registerDto.phone;
    user.bank = registerDto.bank || null;
    user.role = 'customer';
    user.isEmailVerified = false;
    await this.userRepository.save(user);

    const otpCode = await this.generateAndSendOtp(email);
    return {
      message: 'Account created successfully. Please verify the OTP sent to your email.',
      requiresOtp: true,
      devOtp: this.isDevOtpEnabled() ? otpCode : undefined,
    };
  }

  async generateAndSendOtp(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    // Invalidate existing OTPs for this email
    await this.otpRepository.update(
      { email: normalizedEmail },
      { verified: true },
    );

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const otp = this.otpRepository.create({
      email: normalizedEmail,
      code,
      expiresAt,
    });
    await this.otpRepository.save(otp);

    await this.sendEmail({
      to: normalizedEmail,
      subject: 'DLEM - Verify your account',
      html: `
        <h2>Account Verification</h2>
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `,
      fallbackText: `Your verification code is: ${code}`,
    });

    return code;
  }

  async verifyOtp(verifyDto: { email: string; otp: string }) {
    const email = this.normalizeEmail(verifyDto.email);
    const { otp } = verifyDto;

    const otpRecord = await this.otpRepository.findOne({
      where: { email, code: otp, verified: false },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Mark as verified
    otpRecord.verified = true;
    await this.otpRepository.save(otpRecord);

    user.isEmailVerified = true;
    await this.userRepository.save(user);

    // Login user
    const payload = { sub: user.id, role: user.role };
    const { passwordHash, ...safeUser } = user;
    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
      user: safeUser,
    };
  }

  async resendOtp(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.isEmailVerified) {
      throw new BadRequestException('User is already verified');
    }

    const otpCode = await this.generateAndSendOtp(normalizedEmail);
    return {
      message: 'OTP resent successfully',
      devOtp: this.isDevOtpEnabled() ? otpCode : undefined,
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (!user) {
      // Return a success message even if the user doesn't exist to prevent email enumeration
      return {
        message:
          'If that email address is in our database, we will send you an email to reset your password.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const passwordResetExpires = new Date();
    passwordResetExpires.setMinutes(passwordResetExpires.getMinutes() + 10); // Token valid for 10 minutes

    user.resetPasswordToken = passwordResetToken;
    user.resetPasswordExpires = passwordResetExpires;
    await this.userRepository.save(user);

    const resetUrl = `${this.getFrontendUrl()}/user/reset-password?token=${resetToken}`;

    await this.sendEmail({
      to: user.email,
      subject: 'DLEM - Password reset request',
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link will expire in 10 minutes.</p>
      `,
      fallbackText: `You requested a password reset. Use this link to reset your password:\n${resetUrl}`,
    });

    return {
      message:
        'If that email address is in our database, we will send you an email to reset your password.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: passwordResetToken,
        resetPasswordExpires: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new BadRequestException('Token is invalid or has expired');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);

    return { message: 'Password has been successfully updated' };
  }
}
