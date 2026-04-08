import { Reminder } from './reminder.entity';
export declare class NotificationLog {
    id: number;
    reminderId: number;
    reminder: Reminder;
    deliveredAt: Date;
    channel: string;
    success: boolean;
    errorMessage: string;
}
