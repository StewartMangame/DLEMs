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
    const announcements = await this.announcementRepo
      .createQueryBuilder('announcement')
      .where('announcement.status = :status', { status: 'active' })
      .andWhere(
        'announcement.startDate IS NULL OR announcement.startDate <= :now',
        { now },
      )
      .andWhere('announcement.expiryDate > :now', { now })
      .orderBy('announcement.createdAt', 'DESC')
      .getMany();

    return announcements.map((announcement) => ({
      id: String(announcement.id),
      message_english: announcement.messageEnglish,
      message_chichewa: announcement.messageChichewa ?? '',
      institution_id:
        announcement.institutionId === null ||
        announcement.institutionId === undefined
          ? null
          : String(announcement.institutionId),
      expires_at: announcement.expiryDate,
    }));
  }
}
