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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loan = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const institution_entity_1 = require("./institution.entity");
const loan_application_entity_1 = require("./loan-application.entity");
const reminder_entity_1 = require("./reminder.entity");
let Loan = class Loan {
    id;
    userId;
    user;
    providerInstitutionId;
    providerInstitution;
    providerName;
    loanAmount;
    interestRate;
    monthlyDeduction;
    loanTermMonths;
    startDate;
    remainingBalance;
    paidMonths;
    isActive;
    loanPurpose;
    applicationId;
    application;
    reminders;
    createdAt;
    updatedAt;
};
exports.Loan = Loan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Loan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Loan.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (u) => u.activeLoans),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], Loan.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Loan.prototype, "providerInstitutionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => institution_entity_1.Institution, (i) => i.loans),
    (0, typeorm_1.JoinColumn)({ name: 'providerInstitutionId' }),
    __metadata("design:type", institution_entity_1.Institution)
], Loan.prototype, "providerInstitution", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Loan.prototype, "providerName", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], Loan.prototype, "loanAmount", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { default: 0 }),
    __metadata("design:type", Number)
], Loan.prototype, "interestRate", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], Loan.prototype, "monthlyDeduction", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Loan.prototype, "loanTermMonths", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Loan.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { nullable: true }),
    __metadata("design:type", Number)
], Loan.prototype, "remainingBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Loan.prototype, "paidMonths", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Loan.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Loan.prototype, "loanPurpose", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Loan.prototype, "applicationId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => loan_application_entity_1.LoanApplication, (a) => a.loan),
    (0, typeorm_1.JoinColumn)({ name: 'applicationId' }),
    __metadata("design:type", loan_application_entity_1.LoanApplication)
], Loan.prototype, "application", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => reminder_entity_1.Reminder, (r) => r.loan),
    __metadata("design:type", Array)
], Loan.prototype, "reminders", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Loan.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Loan.prototype, "updatedAt", void 0);
exports.Loan = Loan = __decorate([
    (0, typeorm_1.Entity)()
], Loan);
//# sourceMappingURL=loan.entity.js.map