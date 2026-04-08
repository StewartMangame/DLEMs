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
const financial_profile_entity_1 = require("../entities/financial-profile.entity");
const institution_entity_1 = require("../entities/institution.entity");
let EligibilityService = class EligibilityService {
    profileRepo;
    instRepo;
    constructor(profileRepo, instRepo) {
        this.profileRepo = profileRepo;
        this.instRepo = instRepo;
    }
    async checkEligibility(params) {
        const { monthlySalary, loanAmount, durationMonths, institutionId, existingLoanAmount } = params;
        const monthlyInstallment = loanAmount / durationMonths;
        const totalRepayable = loanAmount;
        const totalDeductions = (existingLoanAmount || 0) + monthlyInstallment;
        const dtiRatio = (totalDeductions / monthlySalary) * 100;
        const institutions = await this.instRepo.find({ relations: ['criteria'] });
        const bankSimulations = institutions.map(inst => {
            const criteria = inst.criteria;
            if (!criteria)
                return { institutionId: inst.id, bank: inst.name, eligible: false, maxAmount: 0, riskLevel: 'HIGH', rate: 10 };
            const maxAllowedDtiDeduction = (criteria.maxDtiRatio) * monthlySalary;
            const availableCapacity = maxAllowedDtiDeduction - (existingLoanAmount || 0);
            const maxAmountByDti = availableCapacity * durationMonths;
            const maxAmountByMultiplier = monthlySalary * criteria.maxLoanMultiplier;
            const maxAmount = Math.max(0, Math.min(maxAmountByDti, maxAmountByMultiplier));
            const eligible = monthlySalary >= criteria.minNetSalary &&
                dtiRatio <= (criteria.maxDtiRatio * 100) &&
                loanAmount <= maxAmountByMultiplier;
            return {
                institutionId: inst.id,
                bank: inst.name,
                eligible,
                maxAmount,
                riskLevel: eligible ? 'LOW' : 'HIGH',
                rate: 15
            };
        });
        const targetBank = bankSimulations.find(b => b.institutionId === institutionId);
        return {
            result: {
                eligible: targetBank ? targetBank.eligible : false,
                monthlyInstallment,
                totalRepayable,
                dtiRatio,
                maxLoanAmount: targetBank ? targetBank.maxAmount : 0,
                riskScore: 85,
                riskCategory: 'GOOD',
                breakdown: {
                    employment: 35,
                    employmentYears: 20,
                    age: 15,
                    housing: 10,
                    banking: 5
                }
            },
            bankSimulations
        };
    }
};
exports.EligibilityService = EligibilityService;
exports.EligibilityService = EligibilityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(financial_profile_entity_1.FinancialProfile)),
    __param(1, (0, typeorm_1.InjectRepository)(institution_entity_1.Institution)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], EligibilityService);
//# sourceMappingURL=eligibility.service.js.map