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
exports.LoanApplication = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const institution_entity_1 = require("./institution.entity");
const loan_entity_1 = require("./loan.entity");
let LoanApplication = class LoanApplication {
    id;
    userId;
    user;
    institutionId;
    institution;
    amount;
    purpose;
    durationMonths;
    monthlyInstallment;
    riskScore;
    riskCategory;
    dtiRatio;
    status;
    createdAt;
    loan;
};
exports.LoanApplication = LoanApplication;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LoanApplication.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], LoanApplication.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, u => u.applications),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], LoanApplication.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], LoanApplication.prototype, "institutionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => institution_entity_1.Institution, i => i.applications),
    (0, typeorm_1.JoinColumn)({ name: 'institutionId' }),
    __metadata("design:type", institution_entity_1.Institution)
], LoanApplication.prototype, "institution", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], LoanApplication.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], LoanApplication.prototype, "purpose", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], LoanApplication.prototype, "durationMonths", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], LoanApplication.prototype, "monthlyInstallment", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], LoanApplication.prototype, "riskScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'UNKNOWN' }),
    __metadata("design:type", String)
], LoanApplication.prototype, "riskCategory", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { default: 0 }),
    __metadata("design:type", Number)
], LoanApplication.prototype, "dtiRatio", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'PENDING' }),
    __metadata("design:type", String)
], LoanApplication.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LoanApplication.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => loan_entity_1.Loan, l => l.application),
    __metadata("design:type", loan_entity_1.Loan)
], LoanApplication.prototype, "loan", void 0);
exports.LoanApplication = LoanApplication = __decorate([
    (0, typeorm_1.Entity)()
], LoanApplication);
//# sourceMappingURL=loan-application.entity.js.map