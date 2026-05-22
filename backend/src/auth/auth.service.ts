import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Otp } from '../entities/otp.entity';

@Injectable()
export class AuthService {
  private get transporter(): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER') || '',
        pass: this.configService.get<string>('SMTP_PASS') || '',
      },
    });
  }

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async getUserById(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  async login(loginDto: any) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });
    if (
      !user ||
      !(await bcrypt.compare(loginDto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email address first');
    }
    const payload = { sub: user.id, role: user.role };
    const { passwordHash, ...safeUser } = user;
    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
      user: safeUser,
    };
  }

  async register(registerDto: any) {
    // Check if user already exists by email, nationalId, or employeeNumber
    const existing = await this.userRepository.findOne({
      where: [
        { email: registerDto.email },
        { nationalId: registerDto.nationalId },
        { employeeNumber: registerDto.employeeNumber }
      ],
    });

    if (existing) {
      if (existing.email === registerDto.email && !existing.isEmailVerified) {
        // User exists but is unverified. Resend OTP and return.
        // We also update their other details just in case they fixed a typo.
        existing.fullName = registerDto.fullName;
        existing.nationalId = registerDto.nationalId;
        existing.employeeNumber = registerDto.employeeNumber;
        existing.phone = registerDto.phone;
        existing.passwordHash = await bcrypt.hash(registerDto.password, 10);
        await this.userRepository.save(existing);

        const otpDelivery = await this.generateAndSendOtp(existing.email);
        return this.otpResponse('OTP sent successfully to email', otpDelivery);
      }

      if (existing.email === registerDto.email) {
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
    user.email = registerDto.email;
    user.passwordHash = await bcrypt.hash(registerDto.password, 10);
    user.fullName = registerDto.fullName;
    user.nationalId = registerDto.nationalId;
    user.employeeNumber = registerDto.employeeNumber;
    user.phone = registerDto.phone;
    user.bank = registerDto.bank || null;
    user.role = 'customer';
    user.isEmailVerified = false;
    await this.userRepository.save(user);

    const otpDelivery = await this.generateAndSendOtp(user.email);

    return this.otpResponse('OTP sent successfully to email', otpDelivery);
  }

  async generateAndSendOtp(email: string) {
    // Invalidate existing OTPs for this email
    await this.otpRepository.update({ email }, { verified: true });

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const otp = this.otpRepository.create({
      email,
      code,
      expiresAt,
    });
    await this.otpRepository.save(otp);

    const smtpUser = this.configService.get<string>('SMTP_USER') || '';
    const smtpPass = this.configService.get<string>('SMTP_PASS') || '';
    const smtpConfigured =
      smtpUser.trim() !== '' &&
      smtpPass.trim() !== '' &&
      smtpUser !== 'your_email@gmail.com' &&
      smtpPass !== 'your_app_password_here';

    // Send Email
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') || '"DLEM" <noreply@dlem.mw>',
        to: email,
        subject: 'DLEM - Verify your account',
        text: `Your DLEM verification code is ${code}. This code will expire in 10 minutes.`,
        html: `
          <h2>Account Verification</h2>
          <p>Your verification code is: <strong>${code}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        `,
      });

      if (info.rejected?.length) {
        throw new Error(`Recipient rejected: ${info.rejected.join(', ')}`);
      }

      console.log(
        `\n[EMAIL SENT] OTP code sent successfully to ${email} via SMTP.`,
      );
      console.log(
        `[EMAIL DELIVERY] messageId=${info.messageId}; accepted=${info.accepted?.join(', ') || 'none'}; rejected=${info.rejected?.join(', ') || 'none'}; response=${info.response || 'n/a'}`,
      );

      return {
        code,
        sent: true,
        messageId: info.messageId,
        accepted: info.accepted || [],
        rejected: info.rejected || [],
      };
    } catch (smtpError: any) {
      console.warn(
        `\n[SMTP WARNING] Failed to send email via SMTP: ${smtpError.message}`,
      );

      if (smtpConfigured) {
        throw new InternalServerErrorException(
          'Could not send verification email. Please check the email address and try again.',
        );
      }

      console.log(`\n\n-------------------------------------------------------------`);
      console.log(`[MOCK EMAIL SENT TO ${email}]`);
      console.log(`Subject: DLEM - Verify your account`);
      console.log(`Body: Your verification code is: ${code}`);
      console.log(`-------------------------------------------------------------\n\n`);

      return {
        code,
        sent: false,
        error: smtpError.message,
        accepted: [],
        rejected: [email],
      };
    }
  }

  async verifyOtp(verifyDto: { email: string; otp: string }) {
    const { email, otp } = verifyDto;

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
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.isEmailVerified) {
      throw new BadRequestException('User is already verified');
    }

    const otpDelivery = await this.generateAndSendOtp(email);
    return this.otpResponse('OTP resent successfully', otpDelivery);
  }

  private otpResponse(message: string, delivery: any) {
    const response: any = { message };
    const devOtpEnabled = this.configService.get<string>('SHOW_DEV_OTP')?.toLowerCase() === 'true';
    const showDevOtp = !delivery.sent || devOtpEnabled;

    if (showDevOtp) {
      response.devOtp = delivery.code;
      response.emailDelivery = {
        sent: delivery.sent,
        accepted: delivery.accepted,
        rejected: delivery.rejected,
        messageId: delivery.messageId,
        error: delivery.error,
      };
    }

    return response;
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Return a success message even if the user doesn't exist to prevent email enumeration
      return { message: 'If that email address is in our database, we will send you an email to reset your password.' };
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

    // Mock sending email
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
    console.log(`\n\n-------------------------------------------------------------`);
    console.log(`[MOCK EMAIL SENT TO ${user.email}]`);
    console.log(`Subject: Password Reset Request`);
    console.log(`Body: You requested a password reset. Please go to this link to reset your password:\n${resetUrl}`);
    console.log(`-------------------------------------------------------------\n\n`);

    return { message: 'If that email address is in our database, we will send you an email to reset your password.' };
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
