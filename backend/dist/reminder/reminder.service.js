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
var ReminderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const reminder_entity_1 = require("../entities/reminder.entity");
const notification_log_entity_1 = require("../entities/notification-log.entity");
const schedule_1 = require("@nestjs/schedule");
let ReminderService = ReminderService_1 = class ReminderService {
    reminderRepo;
    logRepo;
    logger = new common_1.Logger(ReminderService_1.name);
    constructor(reminderRepo, logRepo) {
        this.reminderRepo = reminderRepo;
        this.logRepo = logRepo;
    }
    async scheduleDailyReminders() {
        this.logger.log('Checking for pending reminders to send today...');
        const reminders = await this.reminderRepo.find({
            where: {
                status: 'PENDING',
                scheduledAt: (0, typeorm_2.LessThanOrEqual)(new Date()),
            },
            relations: ['user', 'loan', 'loan.providerInstitution'],
        });
        for (const reminder of reminders) {
            this.logger.log(`Processing reminder for user ${reminder.user?.email || reminder.userId}`);
            await this.markAsSent(reminder.id);
            await this.logNotification(reminder.id, true, 'SMS');
        }
        this.logger.log(`Processed ${reminders.length} reminders.`);
    }
    async markAsSent(reminderId) {
        await this.reminderRepo.update(reminderId, {
            status: 'SENT',
            sentAt: new Date(),
        });
    }
    async logNotification(reminderId, success, channel, error) {
        const log = this.logRepo.create({
            reminderId,
            channel,
            success,
            errorMessage: error,
        });
        await this.logRepo.save(log);
    }
};
exports.ReminderService = ReminderService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_8AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReminderService.prototype, "scheduleDailyReminders", null);
exports.ReminderService = ReminderService = ReminderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reminder_entity_1.Reminder)),
    __param(1, (0, typeorm_1.InjectRepository)(notification_log_entity_1.NotificationLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ReminderService);
//# sourceMappingURL=reminder.service.js.map