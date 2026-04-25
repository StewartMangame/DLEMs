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
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const user_entity_1 = require("./entities/user.entity");
const institution_entity_1 = require("./entities/institution.entity");
const institution_criteria_entity_1 = require("./entities/institution-criteria.entity");
const financial_profile_entity_1 = require("./entities/financial-profile.entity");
const loan_entity_1 = require("./entities/loan.entity");
const loan_application_entity_1 = require("./entities/loan-application.entity");
const reminder_entity_1 = require("./entities/reminder.entity");
const notification_log_entity_1 = require("./entities/notification-log.entity");
const auth_module_1 = require("./auth/auth.module");
const profile_module_1 = require("./profile/profile.module");
const loans_module_1 = require("./loans/loans.module");
const institutions_module_1 = require("./institutions/institutions.module");
const eligibility_module_1 = require("./eligibility/eligibility.module");
const reminder_module_1 = require("./reminder/reminder.module");
const admin_module_1 = require("./admin/admin.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const institutions_service_1 = require("./institutions/institutions.service");
const auth_service_1 = require("./auth/auth.service");
let AppModule = class AppModule {
    instService;
    authService;
    constructor(instService, authService) {
        this.instService = instService;
        this.authService = authService;
    }
    async onModuleInit() {
        await this.instService.seedDefaultInstitutions();
        await this.authService.seedAdmin();
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'sqlite',
                database: 'loan_db.sqlite',
                entities: [
                    user_entity_1.User, institution_entity_1.Institution, institution_criteria_entity_1.InstitutionCriteria, financial_profile_entity_1.FinancialProfile,
                    loan_entity_1.Loan, loan_application_entity_1.LoanApplication, reminder_entity_1.Reminder, notification_log_entity_1.NotificationLog
                ],
                synchronize: true,
            }),
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule, profile_module_1.ProfileModule, loans_module_1.LoansModule, institutions_module_1.InstitutionsModule,
            eligibility_module_1.EligibilityModule, reminder_module_1.ReminderModule, admin_module_1.AdminModule, dashboard_module_1.DashboardModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    }),
    __metadata("design:paramtypes", [institutions_service_1.InstitutionsService,
        auth_service_1.AuthService])
], AppModule);
//# sourceMappingURL=app.module.js.map