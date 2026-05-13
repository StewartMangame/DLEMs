import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';

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
    const user = await this.userRepository.findOne({ where: { email: loginDto.email } });
    if (!user || !(await bcrypt.compare(loginDto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user.id, role: user.role };
    const { passwordHash, ...safeUser } = user;
    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
      user: safeUser
    };
  }

  async register(registerDto: any) {
    const existing = await this.userRepository.findOne({ where: { email: registerDto.email } });
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
      user: safeUser
    };
  }

  async seedAdmin() {
    const email = 'admin@dlem.mw';
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) return;

    const user = new User();
    user.email = email;
    user.passwordHash = await bcrypt.hash('Admin@123', 10);
    user.fullName = 'System Administrator';
    user.role = 'admin'; // or 'superadmin' based on the controller checks
    user.nationalId = 'ADMIN-001';
    user.employeeNumber = 'ADMIN-001';
    user.phone = '+265 000000000';
    await this.userRepository.save(user);
    console.log('Default admin seeded: admin@dlem.mw / Admin@123');
  }
}
