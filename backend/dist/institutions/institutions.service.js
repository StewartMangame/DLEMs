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
exports.InstitutionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const institution_entity_1 = require("../entities/institution.entity");
const institution_criteria_entity_1 = require("../entities/institution-criteria.entity");
let InstitutionsService = class InstitutionsService {
    instRepo;
    criteriaRepo;
    constructor(instRepo, criteriaRepo) {
        this.instRepo = instRepo;
        this.criteriaRepo = criteriaRepo;
    }
    async getAllInstitutions() {
        return this.instRepo.find({ relations: ['criteria'] });
    }
    async findByName(name) {
        if (!name)
            return null;
        return this.instRepo.findOne({ where: { name } });
    }
    async seedDefautInstitutions() {
        const count = await this.instRepo.count();
        if (count > 0)
            return;
        const banks = [
            { name: 'National Bank of Malawi', type: 'BANK', criteria: { maxDtiRatio: 0.40, minNetSalary: 100000, maxLoanMultiplier: 12 } },
            { name: 'Standard Bank Malawi', type: 'BANK', criteria: { maxDtiRatio: 0.35, minNetSalary: 150000, maxLoanMultiplier: 10 } },
            { name: 'FDH Bank', type: 'BANK', criteria: { maxDtiRatio: 0.33, minNetSalary: 75000, maxLoanMultiplier: 15 } }
        ];
        for (const b of banks) {
            const inst = this.instRepo.create({ name: b.name, type: b.type, isActive: true });
            await this.instRepo.save(inst);
            const crit = this.criteriaRepo.create({ ...b.criteria, institutionId: inst.id });
            await this.criteriaRepo.save(crit);
        }
    }
};
exports.InstitutionsService = InstitutionsService;
exports.InstitutionsService = InstitutionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(institution_entity_1.Institution)),
    __param(1, (0, typeorm_1.InjectRepository)(institution_criteria_entity_1.InstitutionCriteria)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], InstitutionsService);
//# sourceMappingURL=institutions.service.js.map