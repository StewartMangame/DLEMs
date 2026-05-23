import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from '../entities/announcement.entity';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private announcementRepo: Repository<Announcement>,
  ) {}

  async getActiveAnnouncements() {
    const now = new Date();
    return this.announcementRepo
      .createQueryBuilder('announcement')
      .where('announcement.startDate IS NULL OR announcement.startDate <= :now', { now })
      .andWhere('announcement.expiryDate > :now', { now })
      .orderBy('announcement.createdAt', 'DESC')
      .getMany();
  }
}