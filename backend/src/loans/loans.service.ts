import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../entities/loan.entity';
import { LoanApplication } from '../entities/loan-application.entity';
import { FinancialProfile } from '../entities/financial-profile.entity';
import { Reminder } from '../entities/reminder.entity';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(Loan) private loanRepo: Repository<Loan>,
    @InjectRepository(LoanApplication) private appRepo: Repository<LoanApplication>,
    @InjectRepository(FinancialProfile) private profileRepo: Repository<FinancialProfile>,
    @InjectRepository(Reminder) private reminderRepo: Repository<Reminder>,
  ) {}

  async getUserLoans(userId: number) {
    const loans = await this.loanRepo.find({
      where: { userId },
      relations: ['providerInstitution', 'application'],
      order: { createdAt: 'DESC' },
    });

    const applications = await this.appRepo.find({
      where: { userId },
      relations: ['institution'],
      order: { createdAt: 'DESC' },
    });

    return { loans, applications };
  }

  async createManualLoan(userId: number, data: any) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new BadRequestException('Complete financial profile first');

    const loan = this.loanRepo.create({
      userId,
      providerInstitutionId: parseInt(data.institutionId, 10),
      loanAmount: parseFloat(data.loanAmount),
      monthlyDeduction: parseFloat(data.monthlyDeduction),
      loanTermMonths: parseInt(data.loanTermMonths, 10),
      startDate: new Date(data.startDate),
      remainingBalance: parseFloat(data.loanAmount), // Initial balance
      isActive: true,
      paidMonths: 0,
    });
    
    // Update profile totals
    profile.totalBorrowedAmount += loan.loanAmount;
    profile.existingLoanAmount += loan.monthlyDeduction;
    await this.profileRepo.save(profile);
    
    const saved = await this.loanRepo.save(loan);
    await this.scheduleReminders(saved);
    return saved;
  }

  async applyLoan(userId: number, data: any) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new BadRequestException('Complete financial profile first');

    const amount = parseFloat(data.amount);
    const duration = parseInt(data.durationMonths, 10);
    // Assume 18% interest rate for application simulation if not provided
    const rate = 18;
    const monthlyInstallment = (amount * (1 + (rate/100) * (duration/12))) / duration;
    
    const totalNewDebt = profile.existingLoanAmount + monthlyInstallment;
    const dtiRatio = (totalNewDebt / profile.monthlyNetSalary) * 100;

    // Simple risk scoring
    let riskScore = 100 - (dtiRatio * 0.8);
    if (profile.monthlyNetSalary > 1000000) riskScore += 10;
    riskScore = Math.min(120, Math.max(20, Math.round(riskScore)));

    let riskCategory = 'GOOD';
    if (dtiRatio > 50) riskCategory = 'POOR';
    else if (dtiRatio > 35) riskCategory = 'FAIR';
    else if (riskScore > 90) riskCategory = 'EXCELLENT';

    const app = this.appRepo.create({
      userId,
      institutionId: parseInt(data.institutionId, 10),
      amount,
      durationMonths: duration,
      purpose: data.purpose,
      monthlyInstallment,
      dtiRatio,
      riskScore,
      riskCategory,
      status: 'PENDING',
    });
    return this.appRepo.save(app);
  }

  async repayLoan(userId: number, loanId: number) {
    const loan = await this.loanRepo.findOne({ where: { id: loanId, userId, isActive: true } });
    if (!loan) throw new NotFoundException('Active loan not found');

    if (loan.remainingBalance > 0) {
      loan.paidMonths += 1;
      loan.remainingBalance = Math.max(0, loan.remainingBalance - loan.monthlyDeduction);
      if (loan.remainingBalance <= 0 || loan.paidMonths >= loan.loanTermMonths) {
        loan.isActive = false;
        loan.remainingBalance = 0;
      }
      return this.loanRepo.save(loan);
    }
    return loan;
  }

  private async scheduleReminders(loan: Loan) {
    // Generate simple reminders for the loan duration
    const reminders: Reminder[] = [];
    let currentDate = new Date(loan.startDate);
    
    for (let i = 0; i < loan.loanTermMonths; i++) {
        // Find deduction date for the month
        if (i > 0) {
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        // 3 days before
        const reminder3 = new Date(currentDate);
        reminder3.setDate(reminder3.getDate() - 3);
        
        reminders.push(this.reminderRepo.create({
            loanId: loan.id,
            userId: loan.userId,
            scheduledAt: reminder3,
            channel: 'BOTH',
            status: 'PENDING'
        }));
        
        // 1 day before
        const reminder1 = new Date(currentDate);
        reminder1.setDate(reminder1.getDate() - 1);
        
        reminders.push(this.reminderRepo.create({
            loanId: loan.id,
            userId: loan.userId,
            scheduledAt: reminder1,
            channel: 'BOTH',
            status: 'PENDING'
        }));
    }
    await this.reminderRepo.save(reminders);
  }
}
