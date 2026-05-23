import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
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
export class AuthService {
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

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: this.configService.get<string>('SMTP_USER') || '',
        pass: this.configService.get<string>('SMTP_PASS') || '',
      },
    });
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    fallbackText: string;
  }) {
    const from =
      this.configService.get<string>('SMTP_FROM') || '"DLEM" <noreply@dlem.mw>';

    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(
        `\n[EMAIL SENT] ${options.subject} sent successfully to ${options.to}.`,
      );
    } catch (smtpError: any) {
      console.warn(
        `\n[SMTP WARNING] Failed to send "${options.subject}" to ${options.to}: ${smtpError.message}`,
      );
      console.log(
        `\n\n-------------------------------------------------------------`,
      );
      console.log(`[MOCK EMAIL SENT TO ${options.to}]`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body: ${options.fallbackText}`);
      console.log(
        `-------------------------------------------------------------\n\n`,
      );
    }
  }

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
        { employeeNumber: registerDto.employeeNumber },
      ],
    });

    if (existing) {
      if (existing.email === registerDto.email && !existing.isEmailVerified) {
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

        // Send OTP to the email — the front-end will handle verification in the next step
        await this.generateAndSendOtp(registerDto.email);

        return { message: 'Account details updated. Please verify your email.' };
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

    // Send OTP to the email — the front-end will handle verification in the next step
    await this.generateAndSendOtp(registerDto.email);

    return { message: 'Account created successfully. Please verify your email.' };
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

    await this.sendEmail({
      to: email,
      subject: 'DLEM - Verify your account',
      html: `
        <h2>Account Verification</h2>
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `,
      fallbackText: `Your verification code is: ${code}`,
    });
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

    await this.generateAndSendOtp(email);
    return { message: 'OTP resent successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
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

    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

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
