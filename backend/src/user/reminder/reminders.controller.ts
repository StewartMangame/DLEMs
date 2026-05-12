import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reminder } from '../../entities/reminder.entity';

@Controller('reminders')
@UseGuards(AuthGuard('jwt'))
export class RemindersController {
  constructor(
    @InjectRepository(Reminder) private reminderRepo: Repository<Reminder>,
  ) {}

  @Get()
  async getReminders(@Req() req: any) {
    const reminders = await this.reminderRepo.find({
      where: { userId: req.user.userId },
      relations: ['loan', 'loan.providerInstitution'],
      order: { scheduledAt: 'ASC' },
    });
    return { reminders };
  }
}
