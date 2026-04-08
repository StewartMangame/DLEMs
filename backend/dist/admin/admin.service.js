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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const institution_entity_1 = require("../entities/institution.entity");
const institution_criteria_entity_1 = require("../entities/institution-criteria.entity");
const loan_application_entity_1 = require("../entities/loan-application.entity");
let AdminService = class AdminService {
    userRepo;
    instRepo;
    criteriaRepo;
    appRepo;
    constructor(userRepo, instRepo, criteriaRepo, appRepo) {
        this.userRepo = userRepo;
        this.instRepo = instRepo;
        this.criteriaRepo = criteriaRepo;
        this.appRepo = appRepo;
    }
    async getApplications(currentUser, statusFilter) {
        const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE'];
        const where = {};
        if (currentUser.role === 'admin' && currentUser.institutionId) {
            where.institutionId = currentUser.institutionId;
        }
        if (statusFilter && validStatuses.includes(statusFilter)) {
            where.status = statusFilter;
        }
        const applications = await this.appRepo.find({
            where,
            relations: ['user', 'institution'],
            order: { createdAt: 'DESC' },
        });
        const isInstitutionAdmin = currentUser.role === 'admin' && currentUser.institutionId;
        return {
            applications: applications.map(app => ({
                ...app,
                user: isInstitutionAdmin
                    ? { fullName: 'Applicant ***', employeeNumber: app.user?.employeeNumber?.slice(0, 4) + '****' }
                    : app.user,
            })),
        };
    }
    async getApplication(id) {
        const app = await this.appRepo.findOne({ where: { id }, relations: ['user', 'institution'] });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        return { application: app };
    }
    async reviewApplication(currentUser, id, data) {
        const app = await this.appRepo.findOne({ where: { id } });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        app.status = data.status;
        await this.appRepo.save(app);
        return { success: true, application: app };
    }
    async getStats(currentUser) {
        const where = {};
        if (currentUser.role === 'admin' && currentUser.institutionId) {
            where.institutionId = currentUser.institutionId;
        }
        const total = await this.appRepo.count({ where });
        const pending = await this.appRepo.count({ where: { ...where, status: 'PENDING' } });
        const approved = await this.appRepo.count({ where: { ...where, status: 'APPROVED' } });
        const rejected = await this.appRepo.count({ where: { ...where, status: 'REJECTED' } });
        const active = await this.appRepo.count({ where: { ...where, status: 'ACTIVE' } });
        return { total, pending, approved, rejected, active };
    }
    async createInstitution(data) {
        const inst = this.instRepo.create({ name: data.name, type: data.type, isActive: true });
        await this.instRepo.save(inst);
        const crit = this.criteriaRepo.create({
            institutionId: inst.id,
            maxDtiRatio: data.maxDtiRatio ?? 0.4,
            minNetSalary: data.minNetSalary ?? 100000,
            maxLoanMultiplier: data.maxLoanMultiplier ?? 10,
        });
        await this.criteriaRepo.save(crit);
        return { success: true, institution: inst };
    }
    async assignAdmin(userId, institutionId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.role = 'admin';
        user.isInstitutionAdmin = true;
        user.institutionId = institutionId;
        await this.userRepo.save(user);
        return { success: true, user };
    }
    async updateCriteria(institutionId, data) {
        let crit = await this.criteriaRepo.findOne({ where: { institutionId } });
        if (!crit)
            throw new common_1.NotFoundException('Criteria not found');
        if (data.maxDtiRatio !== undefined)
            crit.maxDtiRatio = data.maxDtiRatio;
        if (data.minNetSalary !== undefined)
            crit.minNetSalary = data.minNetSalary;
        if (data.maxLoanMultiplier !== undefined)
            crit.maxLoanMultiplier = data.maxLoanMultiplier;
        await this.criteriaRepo.save(crit);
        return { success: true, criteria: crit };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(institution_entity_1.Institution)),
    __param(2, (0, typeorm_1.InjectRepository)(institution_criteria_entity_1.InstitutionCriteria)),
    __param(3, (0, typeorm_1.InjectRepository)(loan_application_entity_1.LoanApplication)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map