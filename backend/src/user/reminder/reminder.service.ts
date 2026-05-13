import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Reminder } from '../../entities/reminder.entity';
import { NotificationLog } from '../../entities/notification-log.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    @InjectRepository(Reminder) private reminderRepo: Repository<Reminder>,
    @InjectRepository(NotificationLog) private logRepo: Repository<NotificationLog>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM) // Schedule daily check
  async scheduleDailyReminders() {
    this.logger.log('Checking for pending reminders to send today...');
    
    const reminders = await this.reminderRepo.find({
      where: {
        status: 'PENDING',
        scheduledAt: LessThanOrEqual(new Date())
      },
      relations: ['user', 'loan', 'loan.providerInstitution']
    });

    for (const reminder of reminders) {
      this.logger.log(`Processing reminder for user ${reminder.user?.email || reminder.userId}`);
      // In a real scenario without Bull, we'd call the notification logic directly here.
      // For now, we just mark it as sent for simulation purposes.
      await this.markAsSent(reminder.id);
      await this.logNotification(reminder.id, true, 'SMS');
    }
    
    this.logger.log(`Processed ${reminders.length} reminders.`);
  }

  async markAsSent(reminderId: number) {
    await this.reminderRepo.update(reminderId, { status: 'SENT', sentAt: new Date() });
  }

  async logNotification(reminderId: number, success: boolean, channel: string, error?: string) {
    const log = this.logRepo.create({
      reminderId,
      channel,
      success,
      errorMessage: error,
    });
    await this.logRepo.save(log);
  }
}
