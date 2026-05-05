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
exports.EligibilityService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const institution_entity_1 = require("../entities/institution.entity");
const eligibilityEngine_1 = require("../lib/eligibilityEngine");
let EligibilityService = class EligibilityService {
    instRepo;
    constructor(instRepo) {
        this.instRepo = instRepo;
    }
    async compareInstitutions(params) {
        const { monthlyNetSalary, existingMonthlyRepayments, employmentCategory, requestedAmount, requestedTermMonths, institutionIds, } = params;
        const whereClause = { isActive: true };
        if (institutionIds && institutionIds.length > 0) {
            whereClause.id = (0, typeorm_2.In)(institutionIds);
        }
        const institutions = await this.instRepo.find({
            where: whereClause,
            relations: ['criteria'],
        });
        const checkParams = institutions
            .filter((inst) => inst.criteria)
            .map((inst) => ({
            institutionId: inst.id,
            institutionName: inst.name,
            institutionType: inst.type,
            criteria: {
                interestRate: inst.criteria.interestRate,
                maxDtiRatio: inst.criteria.maxDtiRatio,
                minNetSalary: inst.criteria.minNetSalary,
                minRepaymentMonths: inst.criteria.minRepaymentMonths,
                maxRepaymentMonths: inst.criteria.maxRepaymentMonths,
                processingFeePercent: inst.criteria.processingFeePercent,
                civilServantMultiplier: inst.criteria.civilServantMultiplier,
                privateMultiplier: inst.criteria.privateMultiplier,
                selfEmployedMultiplier: inst.criteria.selfEmployedMultiplier,
                saccoMemberMultiplier: inst.criteria.saccoMemberMultiplier,
                eligibleEmploymentTypes: inst.criteria.eligibleEmploymentTypes ?? [],
                requiresGuarantor: inst.criteria.requiresGuarantor,
                requiresPayslip: inst.criteria.requiresPayslip,
                notes: inst.criteria.notes ?? '',
            },
            monthlyNetSalary,
            existingMonthlyRepayments,
            employmentCategory,
            requestedAmount,
            requestedTermMonths,
        }));
        return (0, eligibilityEngine_1.rankInstitutions)(checkParams);
    }
    async checkEligibility(params) {
        const { monthlySalary, monthlyNetSalary, existingLoanAmount, loanAmount, durationMonths, institutionId, employmentCategory, } = params;
        const salary = monthlyNetSalary || monthlySalary || 0;
        const existing = existingLoanAmount || 0;
        const category = employmentCategory || 'private_sector';
        const amount = parseFloat(loanAmount) || 0;
        const term = parseInt(durationMonths) || 24;
        const compareResult = await this.compareInstitutions({
            monthlyNetSalary: salary,
            existingMonthlyRepayments: existing,
            employmentCategory: category,
            requestedAmount: amount,
            requestedTermMonths: term,
            institutionIds: undefined,
        });
        const targetInstitutionId = parseInt(institutionId, 10);
        const allResults = [...compareResult.ranked, ...compareResult.ineligible];
        const targetResult = allResults.find((r) => r.institutionId === targetInstitutionId) ?? null;
        return {
            result: targetResult,
            bankSimulations: allResults,
        };
    }
    async getInstitutionsPublic() {
        const institutions = await this.instRepo.find({
            where: { isActive: true },
            relations: ['criteria'],
        });
        return institutions.map((inst) => ({
            id: inst.id,
            name: inst.name,
            type: inst.type,
            criteria: inst.criteria
                ? {
                    interestRate: inst.criteria.interestRate,
                    minNetSalary: inst.criteria.minNetSalary,
                    maxDtiRatio: inst.criteria.maxDtiRatio,
                    minRepaymentMonths: inst.criteria.minRepaymentMonths,
                    maxRepaymentMonths: inst.criteria.maxRepaymentMonths,
                    processingFeePercent: inst.criteria.processingFeePercent,
                    requiresGuarantor: inst.criteria.requiresGuarantor,
                    requiresPayslip: inst.criteria.requiresPayslip,
                    eligibleEmploymentTypes: inst.criteria.eligibleEmploymentTypes,
                    civilServantMultiplier: inst.criteria.civilServantMultiplier,
                    privateMultiplier: inst.criteria.privateMultiplier,
                    selfEmployedMultiplier: inst.criteria.selfEmployedMultiplier,
                    saccoMemberMultiplier: inst.criteria.saccoMemberMultiplier,
                    notes: inst.criteria.notes,
                }
                : null,
        }));
    }
};
exports.EligibilityService = EligibilityService;
exports.EligibilityService = EligibilityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(institution_entity_1.Institution)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EligibilityService);
//# sourceMappingURL=eligibility.service.js.map