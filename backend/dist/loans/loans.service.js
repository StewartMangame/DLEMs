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
        return this.loanRepo.find({
            where: { userId },
            relations: ['providerInstitution'],
            order: { createdAt: 'DESC' },
        });
    }
    async createManualLoan(userId, data) {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile)
            throw new common_1.BadRequestException('Complete financial profile first');
        const loan = this.loanRepo.create({
            userId,
            providerInstitutionId: parseInt(data.institutionId, 10),
            loanAmount: parseFloat(data.loanAmount),
            monthlyDeduction: parseFloat(data.monthlyDeduction),
            loanTermMonths: parseInt(data.loanTermMonths, 10),
            startDate: new Date(data.startDate),
            remainingBalance: parseFloat(data.loanAmount),
            isActive: true,
            paidMonths: 0,
        });
        profile.totalBorrowedAmount += loan.loanAmount;
        profile.existingLoanAmount += loan.monthlyDeduction;
        await this.profileRepo.save(profile);
        const saved = await this.loanRepo.save(loan);
        await this.scheduleReminders(saved);
        return saved;
    }
    async applyLoan(userId, data) {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile)
            throw new common_1.BadRequestException('Complete financial profile first');
        const app = this.appRepo.create({
            userId,
            institutionId: parseInt(data.institutionId, 10),
            amount: parseFloat(data.amount),
            durationMonths: parseInt(data.durationMonths, 10),
            purpose: data.purpose,
            monthlyInstallment: parseFloat(data.monthlyInstallment) || (parseFloat(data.amount) / parseInt(data.durationMonths, 10)),
            dtiRatio: data.dtiRatio || 0,
            riskScore: data.riskScore || 0,
            riskCategory: data.riskCategory || 'UNKNOWN',
            status: 'PENDING',
        });
        return this.appRepo.save(app);
    }
    async repayLoan(userId, loanId) {
        const loan = await this.loanRepo.findOne({ where: { id: loanId, userId, isActive: true } });
        if (!loan)
            throw new common_1.NotFoundException('Active loan not found');
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
    async scheduleReminders(loan) {
        const reminders = [];
        let currentDate = new Date(loan.startDate);
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
                status: 'PENDING'
            }));
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