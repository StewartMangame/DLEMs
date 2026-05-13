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
exports.InstitutionCriteria = void 0;
const typeorm_1 = require("typeorm");
const institution_entity_1 = require("./institution.entity");
let InstitutionCriteria = class InstitutionCriteria {
    id;
    institutionId;
    institution;
    maxDtiRatio;
    minNetSalary;
    interestRate;
    processingFeePercent;
    minRepaymentMonths;
    maxRepaymentMonths;
    civilServantMultiplier;
    privateMultiplier;
    selfEmployedMultiplier;
    saccoMemberMultiplier;
    eligibleEmploymentTypes;
    requiresGuarantor;
    requiresPayslip;
    notes;
    customCriteria;
    updatedAt;
};
exports.InstitutionCriteria = InstitutionCriteria;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], InstitutionCriteria.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], InstitutionCriteria.prototype, "institutionId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => institution_entity_1.Institution, (i) => i.criteria),
    (0, typeorm_1.JoinColumn)({ name: 'institutionId' }),
    __metadata("design:type", institution_entity_1.Institution)
], InstitutionCriteria.prototype, "institution", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], InstitutionCriteria.prototype, "maxDtiRatio", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], InstitutionCriteria.prototype, "minNetSalary", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { default: 25 }),
    __metadata("design:type", Number)
], InstitutionCriteria.prototype, "interestRate", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { default: 0 }),
    __metadata("design:type", Number)
], InstitutionCriteria.prototype, "processingFeePercent", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 3 }),
    __metadata("design:type", Number)
], InstitutionCriteria.prototype, "minRepaymentMonths", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 60 }),
    __metadata("design:type", Number)
], InstitutionCriteria.prototype, "maxRepaymentMonths", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { default: 6 }),
    __metadata("design:type", Number)
], InstitutionCriteria.prototype, "civilServantMultiplier", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { default: 4 }),
    __metadata("design:type", Number)
], InstitutionCriteria.prototype, "privateMultiplier", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { default: 2 }),
    __metadata("design:type", Number)
], InstitutionCriteria.prototype, "selfEmployedMultiplier", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { default: 8 }),
    __metadata("design:type", Number)
], InstitutionCriteria.prototype, "saccoMemberMultiplier", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-json', {
        default: '["civil_servant","private_sector","self_employed","sacco_member"]',
    }),
    __metadata("design:type", Array)
], InstitutionCriteria.prototype, "eligibleEmploymentTypes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], InstitutionCriteria.prototype, "requiresGuarantor", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], InstitutionCriteria.prototype, "requiresPayslip", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], InstitutionCriteria.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-json', { nullable: true, default: '[]' }),
    __metadata("design:type", Object)
], InstitutionCriteria.prototype, "customCriteria", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], InstitutionCriteria.prototype, "updatedAt", void 0);
exports.InstitutionCriteria = InstitutionCriteria = __decorate([
    (0, typeorm_1.Entity)()
], InstitutionCriteria);
//# sourceMappingURL=institution-criteria.entity.js.map