"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const reminder_entity_1 = require("../entities/reminder.entity");
const notification_log_entity_1 = require("../entities/notification-log.entity");
const user_entity_1 = require("../entities/user.entity");
const reminder_service_1 = require("./reminder.service");
const reminders_controller_1 = require("./reminders.controller");
let ReminderModule = class ReminderModule {
};
exports.ReminderModule = ReminderModule;
exports.ReminderModule = ReminderModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([reminder_entity_1.Reminder, notification_log_entity_1.NotificationLog, user_entity_1.User])],
        controllers: [reminders_controller_1.RemindersController],
        providers: [reminder_service_1.ReminderService],
    })
], ReminderModule);
//# sourceMappingURL=reminder.module.js.map