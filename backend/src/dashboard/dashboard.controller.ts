import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Loan } from '../entities/loan.entity';
import { LoanApplication } from '../entities/loan-application.entity';
import { FinancialProfile } from '../entities/financial-profile.entity';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Loan) private loanRepo: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private appRepo: Repository<LoanApplication>,
    @InjectRepository(FinancialProfile)
    private profileRepo: Repository<FinancialProfile>,
  ) {}

  @Get()
  async getDashboard(@Req() req: any) {
    const userId = req.user.userId;
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'fullName', 'employeeNumber', 'email', 'phone', 'role'],
    });

    const profile = await this.profileRepo.findOne({
      where: { userId },
      relations: ['salaryInstitution'],
    });

    const activeLoans = await this.loanRepo.find({
      where: { userId, isActive: true },
      relations: ['providerInstitution'],
      take: 3,
    });

    const applications = await this.appRepo.find({
      where: { userId },
      relations: ['institution'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return { user, profile, activeLoans, applications };
  }
}
