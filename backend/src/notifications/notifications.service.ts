import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationLog } from './notification-log.entity';
import { Reminder } from '../entities/reminder.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
  ) {}

  /**
   * Sends reminder notification (currently simulated)
   * In production, this can be replaced with SMS/Email API
   */
  async sendReminderNotification(reminder: Reminder): Promise<boolean> {
    try {
      // 🔔 Simulated notification
      this.logger.log(
        `Sending reminder → User: ${reminder.userId}, Loan: ${reminder.loanId}, Date: ${reminder.scheduledAt}`,
      );

      const success = true;

      await this.logRepo.save({
        reminderId: reminder.id,
        channel: reminder.channel || 'SMS',
        success,
        errorMessage: null,
      });

      return true;
    } catch (error: any) {
      const message = error?.message || 'Unknown error';

      this.logger.error(
        `Failed to send reminder ${reminder.id}: ${message}`,
      );

      await this.logRepo.save({
        reminderId: reminder.id,
        channel: reminder.channel || 'SMS',
        success: false,
        errorMessage: message,
      });

      return false;
    }
  }

  /**
   * Simple test endpoint for debugging notifications
   */
  async testNotification(userId: number) {
    this.logger.log(`Test notification sent to user ${userId}`);
    return { success: true };
  }
}