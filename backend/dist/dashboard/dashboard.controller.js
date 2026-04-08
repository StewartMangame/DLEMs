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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const loan_entity_1 = require("../entities/loan.entity");
const loan_application_entity_1 = require("../entities/loan-application.entity");
const financial_profile_entity_1 = require("../entities/financial-profile.entity");
let DashboardController = class DashboardController {
    userRepo;
    loanRepo;
    appRepo;
    profileRepo;
    constructor(userRepo, loanRepo, appRepo, profileRepo) {
        this.userRepo = userRepo;
        this.loanRepo = loanRepo;
        this.appRepo = appRepo;
        this.profileRepo = profileRepo;
    }
    async getDashboard(req) {
        const userId = req.user.userId;
        const user = await this.userRepo.findOne({
            where: { id: userId },
            select: ['id', 'fullName', 'employeeNumber', 'email', 'phone', 'role'],
        });
        const profile = await this.profileRepo.findOne({
            where: { userId },
            relations: ['salaryInstitution'],
        });
        const activeLoans = await this.loanRepo.find({
            where: { userId, isActive: true },
            relations: ['providerInstitution'],
            take: 3,
        });
        const applications = await this.appRepo.find({
            where: { userId },
            relations: ['institution'],
            order: { createdAt: 'DESC' },
            take: 5,
        });
        return { user, profile, activeLoans, applications };
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getDashboard", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)('dashboard'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(loan_entity_1.Loan)),
    __param(2, (0, typeorm_1.InjectRepository)(loan_application_entity_1.LoanApplication)),
    __param(3, (0, typeorm_1.InjectRepository)(financial_profile_entity_1.FinancialProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map