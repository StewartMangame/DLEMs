import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Reminder } from '../entities/reminder.entity';
import { NotificationLog } from '../entities/notification-log.entity';

import { ReminderService } from './reminder.service';
import { RemindersController } from './reminders.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reminder,
      NotificationLog,
    ]),
  ],
  controllers: [RemindersController],
  providers: [ReminderService],
})
export class ReminderModule {}