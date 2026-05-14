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
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const admin_activity_log_entity_1 = require("./entities/admin-activity-log.entity");
const admin_user_entity_1 = require("./entities/admin-user.entity");
const announcement_entity_1 = require("./entities/announcement.entity");
const content_string_entity_1 = require("./entities/content-string.entity");
const eligibility_check_log_entity_1 = require("./entities/eligibility-check-log.entity");
const financial_profile_entity_1 = require("./entities/financial-profile.entity");
const institution_criteria_entity_1 = require("./entities/institution-criteria.entity");
const institution_entity_1 = require("./entities/institution.entity");
const loan_application_entity_1 = require("./entities/loan-application.entity");
const loan_product_entity_1 = require("./entities/loan-product.entity");
const loan_entity_1 = require("./entities/loan.entity");
const notification_log_entity_1 = require("./entities/notification-log.entity");
const reminder_entity_1 = require("./entities/reminder.entity");
const sacco_entity_1 = require("./entities/sacco.entity");
const user_entity_1 = require("./entities/user.entity");
const admin_panel_module_1 = require("./admin/admin-panel.module");
const admin_module_1 = require("./admin/admin.module");
const auth_module_1 = require("./auth/auth.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const eligibility_module_1 = require("./eligibility/eligibility.module");
const institutions_module_1 = require("./institutions/institutions.module");
const institutions_service_1 = require("./institutions/institutions.service");
const loans_module_1 = require("./loans/loans.module");
const profile_module_1 = require("./profile/profile.module");
const reminder_module_1 = require("./reminder/reminder.module");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
let AppModule = class AppModule {
    instService;
    constructor(instService) {
        this.instService = instService;
    }
    async onModuleInit() {
        await this.instService.seedDefaultInstitutions();
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'sqlite',
                    database: config.get('SQLITE_DB_PATH', 'loan_db.sqlite'),
                    entities: [
                        user_entity_1.User,
                        institution_entity_1.Institution,
                        institution_criteria_entity_1.InstitutionCriteria,
                        financial_profile_entity_1.FinancialProfile,
                        loan_entity_1.Loan,
                        loan_application_entity_1.LoanApplication,
                        reminder_entity_1.Reminder,
                        notification_log_entity_1.NotificationLog,
                        admin_user_entity_1.AdminUser,
                        admin_activity_log_entity_1.AdminActivityLog,
                        sacco_entity_1.Sacco,
                        loan_product_entity_1.LoanProduct,
                        content_string_entity_1.ContentString,
                        announcement_entity_1.Announcement,
                        eligibility_check_log_entity_1.EligibilityCheckLog,
                    ],
                    synchronize: config.get('TYPEORM_SYNC', 'true') === 'true',
                }),
            }),
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            profile_module_1.ProfileModule,
            loans_module_1.LoansModule,
            institutions_module_1.InstitutionsModule,
            eligibility_module_1.EligibilityModule,
            reminder_module_1.ReminderModule,
            admin_module_1.AdminModule,
            admin_panel_module_1.AdminPanelModule,
            dashboard_module_1.DashboardModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    }),
    __metadata("design:paramtypes", [institutions_service_1.InstitutionsService])
], AppModule);
//# sourceMappingURL=app.module.js.map