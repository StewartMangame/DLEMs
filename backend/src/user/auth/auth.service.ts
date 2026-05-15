import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { User } from '../../entities/user.entity';
import { Otp } from '../../entities/otp.entity';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
    private jwtService: JwtService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
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
        
        await this.generateAndSendOtp(existing.email);
        return { message: 'OTP sent successfully to email' };
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

    await this.generateAndSendOtp(user.email);

    return { message: 'OTP sent successfully to email' };
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

    // Send Email
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || '"DLEM" <noreply@dlem.mw>',
      to: email,
      subject: 'DLEM - Verify your account',
      html: `
        <h2>Account Verification</h2>
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `,
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
}
