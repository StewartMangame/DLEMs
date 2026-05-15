import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../../entities/loan.entity';
import { Institution } from '../../entities/institution.entity';
import { LoanApplication } from '../../entities/loan-application.entity';
import { FinancialProfile } from '../../entities/financial-profile.entity';
import { Reminder } from '../../entities/reminder.entity';
import { calculateMonthlyInstallment } from '../lib/eligibilityEngine';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(Loan) private loanRepo: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private appRepo: Repository<LoanApplication>,
    @InjectRepository(FinancialProfile)
    private profileRepo: Repository<FinancialProfile>,
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
    if (!profile)
      throw new BadRequestException('Complete financial profile first');

    const loanAmount = parseFloat(data.loanAmount);
    let interestRate = parseFloat(data.interestRate) || 0;
    const loanTermMonths = parseInt(data.loanTermMonths, 10);
    const startDate = new Date(data.startDate);
    const loanPurpose = data.loanPurpose || data.purpose || null;
    const providerName = data.providerName || null;
    const institutionId = data.institutionId
      ? parseInt(data.institutionId, 10)
      : null;

    if (institutionId) {
      const inst = await this.loanRepo.manager.findOne(Institution, {
        where: { id: institutionId },
        relations: ['criteria'],
      });
      if (inst && inst.criteria && inst.criteria.fixedInterestRate) {
        interestRate = inst.criteria.fixedInterestRate;
      }
    }

    const monthlyDeduction = data.monthlyDeduction
      ? parseFloat(data.monthlyDeduction)
      : calculateMonthlyInstallment(loanAmount, interestRate, loanTermMonths);

    const now = new Date();
    const monthsDiff =
      (now.getFullYear() - startDate.getFullYear()) * 12 +
      (now.getMonth() - startDate.getMonth());
    const paidMonths = Math.max(0, Math.min(monthsDiff, loanTermMonths));

    let remainingBalance = loanAmount;
    if (interestRate > 0 && paidMonths > 0) {
      const r = interestRate / 100 / 12;
      const factor_n = Math.pow(1 + r, loanTermMonths);
      const factor_k = Math.pow(1 + r, paidMonths);
      remainingBalance = (loanAmount * (factor_n - factor_k)) / (factor_n - 1);
    } else if (paidMonths > 0) {
      remainingBalance = loanAmount - monthlyDeduction * paidMonths;
    }
    remainingBalance = Math.max(0, remainingBalance);

    const loan = this.loanRepo.create({
      userId,
      providerInstitutionId: institutionId,
      providerName,
      loanAmount,
      interestRate,
      monthlyDeduction: Math.round(monthlyDeduction),
      loanTermMonths,
      startDate,
      remainingBalance: Math.round(remainingBalance),
      isActive: paidMonths < loanTermMonths,
      paidMonths,
      loanPurpose,
    });

    profile.totalBorrowedAmount += loanAmount;
    profile.existingLoanAmount += Math.round(monthlyDeduction);
    await this.profileRepo.save(profile);

    const saved = await this.loanRepo.save(loan);
    await this.scheduleReminders(saved);
    return saved;
  }

  async getRepaymentSchedule(userId: number, loanId: number) {
    const loan = await this.loanRepo.findOne({ where: { id: loanId, userId } });
    if (!loan) throw new NotFoundException('Loan not found');

    const schedule: Array<{
      month: number;
      installment: number;
      principal: number;
      interest: number;
      balance: number;
      isPaid: boolean;
    }> = [];

    let balance = loan.loanAmount;
    const monthlyRate = (loan.interestRate || 0) / 100 / 12;

    for (let i = 1; i <= loan.loanTermMonths; i++) {
      const interest = balance * monthlyRate;
      const principal = loan.monthlyDeduction - interest;
      balance = Math.max(0, balance - principal);
      schedule.push({
        month: i,
        installment: Math.round(loan.monthlyDeduction),
        principal: Math.round(principal),
        interest: Math.round(interest),
        balance: Math.round(balance),
        isPaid: i <= loan.paidMonths,
      });
    }

    return { loan, schedule };
  }

  async applyLoan(userId: number, data: any) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile)
      throw new BadRequestException('Complete financial profile first');

    const amount = parseFloat(data.amount);
    const duration = parseInt(data.durationMonths, 10);
    const institutionId = parseInt(data.institutionId, 10);

    // Fetch institution to enforce fixed rates
    const inst = await this.appRepo.manager.findOne(Institution, {
      where: { id: institutionId },
      relations: ['criteria'],
    });

    const rate =
      inst && inst.criteria && inst.criteria.fixedInterestRate
        ? inst.criteria.fixedInterestRate
        : inst && inst.criteria && inst.criteria.interestRate
          ? inst.criteria.interestRate
          : 18;
    const monthlyInstallment = calculateMonthlyInstallment(
      amount,
      rate,
      duration,
    );

    const totalNewDebt = profile.existingLoanAmount + monthlyInstallment;
    const dtiRatio = (totalNewDebt / profile.monthlyNetSalary) * 100;

    let riskScore = 100 - dtiRatio * 0.8;
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
    const loan = await this.loanRepo.findOne({
      where: { id: loanId, userId, isActive: true },
    });
    if (!loan) throw new NotFoundException('Active loan not found');

    if (loan.remainingBalance > 0) {
      loan.paidMonths += 1;
      const monthlyRate = (loan.interestRate || 0) / 100 / 12;
      const interestPortion = loan.remainingBalance * monthlyRate;
      const principalPortion = loan.monthlyDeduction - interestPortion;
      loan.remainingBalance = Math.max(
        0,
        loan.remainingBalance - principalPortion,
      );

      if (
        loan.remainingBalance <= 0 ||
        loan.paidMonths >= loan.loanTermMonths
      ) {
        loan.isActive = false;
        loan.remainingBalance = 0;
      }
      return this.loanRepo.save(loan);
    }
    return loan;
  }

  async removeLoan(userId: number, loanId: number) {
    const loan = await this.loanRepo.findOne({
      where: { id: loanId, userId },
    });
    if (!loan) throw new NotFoundException('Loan not found');

    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (profile && loan.isActive) {
      profile.existingLoanAmount = Math.max(
        0,
        profile.existingLoanAmount - loan.monthlyDeduction,
      );
      await this.profileRepo.save(profile);
    }

    loan.isActive = false;
    loan.remainingBalance = 0;
    return this.loanRepo.save(loan);
  }

  private async scheduleReminders(loan: Loan) {
    const reminders: Reminder[] = [];
    const currentDate = new Date(loan.startDate);

    for (let i = 0; i < loan.loanTermMonths; i++) {
      if (i > 0) {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      const reminder3 = new Date(currentDate);
      reminder3.setDate(reminder3.getDate() - 3);

      reminders.push(
        this.reminderRepo.create({
          loanId: loan.id,
          userId: loan.userId,
          scheduledAt: reminder3,
          channel: 'BOTH',
          status: 'PENDING',
        }),
      );

      const reminder1 = new Date(currentDate);
      reminder1.setDate(reminder1.getDate() - 1);

      reminders.push(
        this.reminderRepo.create({
          loanId: loan.id,
          userId: loan.userId,
          scheduledAt: reminder1,
          channel: 'BOTH',
          status: 'PENDING',
        }),
      );
    }
    await this.reminderRepo.save(reminders);
  }
}
