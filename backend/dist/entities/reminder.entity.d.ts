import { User } from './user.entity';
import { Loan } from './loan.entity';
import { NotificationLog } from './notification-log.entity';
export declare class Reminder {
    id: number;
    loanId: number;
    loan: Loan;
    userId: number;
    user: User;
    scheduledAt: Date;
    sentAt: Date;
    channel: string;
    status: string;
    deductionConfirmed: boolean;
    logs: NotificationLog[];
}
