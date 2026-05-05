"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoansModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const loan_entity_1 = require("../entities/loan.entity");
const loan_application_entity_1 = require("../entities/loan-application.entity");
const institution_entity_1 = require("../entities/institution.entity");
const financial_profile_entity_1 = require("../entities/financial-profile.entity");
const reminder_entity_1 = require("../entities/reminder.entity");
const loans_controller_1 = require("./loans.controller");
const loans_service_1 = require("./loans.service");
let LoansModule = class LoansModule {
};
exports.LoansModule = LoansModule;
exports.LoansModule = LoansModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                loan_entity_1.Loan,
                loan_application_entity_1.LoanApplication,
                institution_entity_1.Institution,
                financial_profile_entity_1.FinancialProfile,
                reminder_entity_1.Reminder,
            ]),
        ],
        controllers: [loans_controller_1.LoansController],
        providers: [loans_service_1.LoansService],
    })
], LoansModule);
//# sourceMappingURL=loans.module.js.map