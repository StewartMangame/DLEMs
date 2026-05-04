import { Repository } from 'typeorm';
import { Reminder } from '../entities/reminder.entity';
export declare class RemindersController {
    private reminderRepo;
    constructor(reminderRepo: Repository<Reminder>);
    getReminders(req: any): Promise<{
        reminders: Reminder[];
    }>;
}
