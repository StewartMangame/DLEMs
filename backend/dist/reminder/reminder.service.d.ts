import { Repository } from 'typeorm';
import { Reminder } from '../entities/reminder.entity';
import { NotificationLog } from '../entities/notification-log.entity';
export declare class ReminderService {
    private reminderRepo;
    private logRepo;
    private readonly logger;
    constructor(reminderRepo: Repository<Reminder>, logRepo: Repository<NotificationLog>);
    scheduleDailyReminders(): Promise<void>;
    markAsSent(reminderId: number): Promise<void>;
    logNotification(reminderId: number, success: boolean, channel: string, error?: string): Promise<void>;
}
