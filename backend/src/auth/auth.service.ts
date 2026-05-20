import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
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
    const payload = { sub: user.id, role: user.role };
    const { passwordHash, ...safeUser } = user;
    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
      user: safeUser,
    };
  }

  async register(registerDto: any) {
    const existing = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });
    if (existing) {
      throw new BadRequestException('User already exists');
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
    await this.userRepository.save(user);

    const payload = { sub: user.id, role: user.role };
    const { passwordHash, ...safeUser } = user;
    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
      user: safeUser,
    };
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
    const resetUrl = `http://localhost:3000/user/reset-password?token=${resetToken}`;
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
