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
exports.Institution = void 0;
const typeorm_1 = require("typeorm");
const institution_criteria_entity_1 = require("./institution-criteria.entity");
const user_entity_1 = require("./user.entity");
const loan_entity_1 = require("./loan.entity");
const financial_profile_entity_1 = require("./financial-profile.entity");
const loan_application_entity_1 = require("./loan-application.entity");
let Institution = class Institution {
    id;
    name;
    type;
    status;
    isActive;
    description;
    logoUrl;
    isInterestRateFixed;
    requiresCrbCheck;
    collateralAccepted;
    turnaroundTime;
    reminderAvailable;
    digitalApplicationAvailable;
    requiredDocuments;
    reviewDueDate;
    lastVerifiedAt;
    createdAt;
    updatedAt;
    criteria;
    admins;
    loans;
    profiles;
    applications;
};
exports.Institution = Institution;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Institution.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Institution.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Institution.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'active' }),
    __metadata("design:type", String)
], Institution.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Institution.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Institution.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Institution.prototype, "logoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Institution.prototype, "isInterestRateFixed", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Institution.prototype, "requiresCrbCheck", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Institution.prototype, "collateralAccepted", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Institution.prototype, "turnaroundTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Institution.prototype, "reminderAvailable", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Institution.prototype, "digitalApplicationAvailable", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Array)
], Institution.prototype, "requiredDocuments", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Institution.prototype, "reviewDueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Institution.prototype, "lastVerifiedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Institution.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Institution.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => institution_criteria_entity_1.InstitutionCriteria, (c) => c.institution),
    __metadata("design:type", institution_criteria_entity_1.InstitutionCriteria)
], Institution.prototype, "criteria", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_entity_1.User, (u) => u.institution),
    __metadata("design:type", Array)
], Institution.prototype, "admins", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => loan_entity_1.Loan, (l) => l.providerInstitution),
    __metadata("design:type", Array)
], Institution.prototype, "loans", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => financial_profile_entity_1.FinancialProfile, (f) => f.salaryInstitution),
    __metadata("design:type", Array)
], Institution.prototype, "profiles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => loan_application_entity_1.LoanApplication, (l) => l.institution),
    __metadata("design:type", Array)
], Institution.prototype, "applications", void 0);
exports.Institution = Institution = __decorate([
    (0, typeorm_1.Entity)()
], Institution);
//# sourceMappingURL=institution.entity.js.map