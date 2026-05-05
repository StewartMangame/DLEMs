"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoansService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const loan_entity_1 = require("../entities/loan.entity");
const loan_application_entity_1 = require("../entities/loan-application.entity");
const financial_profile_entity_1 = require("../entities/financial-profile.entity");
const reminder_entity_1 = require("../entities/reminder.entity");
const eligibilityEngine_1 = require("../lib/eligibilityEngine");
let LoansService = class LoansService {
    loanRepo;
    appRepo;
    profileRepo;
    reminderRepo;
    constructor(loanRepo, appRepo, profileRepo, reminderRepo) {
        this.loanRepo = loanRepo;
        this.appRepo = appRepo;
        this.profileRepo = profileRepo;
        this.reminderRepo = reminderRepo;
    }
    async getUserLoans(userId) {
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
    async createManualLoan(userId, data) {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile)
            throw new common_1.BadRequestException('Complete financial profile first');
        const loanAmount = parseFloat(data.loanAmount);
        const interestRate = parseFloat(data.interestRate) || 0;
        const loanTermMonths = parseInt(data.loanTermMonths, 10);
        const startDate = new Date(data.startDate);
        const loanPurpose = data.loanPurpose || data.purpose || null;
        const providerName = data.providerName || null;
        const institutionId = data.institutionId
            ? parseInt(data.institutionId, 10)
            : null;
        const monthlyDeduction = data.monthlyDeduction
            ? parseFloat(data.monthlyDeduction)
            : (0, eligibilityEngine_1.calculateMonthlyInstallment)(loanAmount, interestRate, loanTermMonths);
        const now = new Date();
        const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 +
            (now.getMonth() - startDate.getMonth());
        const paidMonths = Math.max(0, Math.min(monthsDiff, loanTermMonths));
        let remainingBalance = loanAmount;
        if (interestRate > 0 && paidMonths > 0) {
            const r = interestRate / 100 / 12;
            const factor_n = Math.pow(1 + r, loanTermMonths);
            const factor_k = Math.pow(1 + r, paidMonths);
            remainingBalance = (loanAmount * (factor_n - factor_k)) / (factor_n - 1);
        }
        else if (paidMonths > 0) {
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
    async getRepaymentSchedule(userId, loanId) {
        const loan = await this.loanRepo.findOne({ where: { id: loanId, userId } });
        if (!loan)
            throw new common_1.NotFoundException('Loan not found');
        const schedule = [];
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
    async applyLoan(userId, data) {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile)
            throw new common_1.BadRequestException('Complete financial profile first');
        const amount = parseFloat(data.amount);
        const duration = parseInt(data.durationMonths, 10);
        const rate = 18;
        const monthlyInstallment = (0, eligibilityEngine_1.calculateMonthlyInstallment)(amount, rate, duration);
        const totalNewDebt = profile.existingLoanAmount + monthlyInstallment;
        const dtiRatio = (totalNewDebt / profile.monthlyNetSalary) * 100;
        let riskScore = 100 - dtiRatio * 0.8;
        if (profile.monthlyNetSalary > 1000000)
            riskScore += 10;
        riskScore = Math.min(120, Math.max(20, Math.round(riskScore)));
        let riskCategory = 'GOOD';
        if (dtiRatio > 50)
            riskCategory = 'POOR';
        else if (dtiRatio > 35)
            riskCategory = 'FAIR';
        else if (riskScore > 90)
            riskCategory = 'EXCELLENT';
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
    async repayLoan(userId, loanId) {
        const loan = await this.loanRepo.findOne({
            where: { id: loanId, userId, isActive: true },
        });
        if (!loan)
            throw new common_1.NotFoundException('Active loan not found');
        if (loan.remainingBalance > 0) {
            loan.paidMonths += 1;
            const monthlyRate = (loan.interestRate || 0) / 100 / 12;
            const interestPortion = loan.remainingBalance * monthlyRate;
            const principalPortion = loan.monthlyDeduction - interestPortion;
            loan.remainingBalance = Math.max(0, loan.remainingBalance - principalPortion);
            if (loan.remainingBalance <= 0 ||
                loan.paidMonths >= loan.loanTermMonths) {
                loan.isActive = false;
                loan.remainingBalance = 0;
            }
            return this.loanRepo.save(loan);
        }
        return loan;
    }
    async scheduleReminders(loan) {
        const reminders = [];
        const currentDate = new Date(loan.startDate);
        for (let i = 0; i < loan.loanTermMonths; i++) {
            if (i > 0) {
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
            const reminder3 = new Date(currentDate);
            reminder3.setDate(reminder3.getDate() - 3);
            reminders.push(this.reminderRepo.create({
                loanId: loan.id,
                userId: loan.userId,
                scheduledAt: reminder3,
                channel: 'BOTH',
                status: 'PENDING',
            }));
            const reminder1 = new Date(currentDate);
            reminder1.setDate(reminder1.getDate() - 1);
            reminders.push(this.reminderRepo.create({
                loanId: loan.id,
                userId: loan.userId,
                scheduledAt: reminder1,
                channel: 'BOTH',
                status: 'PENDING',
            }));
        }
        await this.reminderRepo.save(reminders);
    }
};
exports.LoansService = LoansService;
exports.LoansService = LoansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(loan_entity_1.Loan)),
    __param(1, (0, typeorm_1.InjectRepository)(loan_application_entity_1.LoanApplication)),
    __param(2, (0, typeorm_1.InjectRepository)(financial_profile_entity_1.FinancialProfile)),
    __param(3, (0, typeorm_1.InjectRepository)(reminder_entity_1.Reminder)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], LoansService);
//# sourceMappingURL=loans.service.js.map