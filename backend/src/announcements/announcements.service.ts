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

  /**
   * Seed some initial announcements for testing.
   * If announcements already exist, skip seeding.
   */
  async seedAnnouncements() {
    const count = await this.announcementRepo.count();
    if (count > 0) {
      return; // Already seeded
    }

    const announcements = [
      {
        messageEnglish: 'Welcome to the Digital Loan Eligibility & Management System! We are excited to have you on board.',
        messageChichewa: 'Welcome to the Digital Loan Eligibility & Management System! Tibwere kuyenda pakuti tidzikupezere chiyani chotchukula.',
        status: 'active',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        institutionId: null, // For all users
      },
      {
        messageEnglish: 'Interest rates have been updated for FDH Bank and FINCA Malawi. Please check the latest rates before applying.',
        messageChichewa: 'Mibango yakondweredwa kwa FDH Bank ndi FINCA Malawi. Chonde chani mibango yochokera kumuyenda kupatonkha.',
        status: 'active',
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        institutionId: null,
      },
      {
        messageEnglish: 'Maintenance scheduled for Sunday, 2 AM - 4 AM. Service may be temporarily unavailable.',
        messageChichewa: 'Chokudzera Lichachi, 2 AM - 4 AM. Chochepetsa cha kuzeredwa, chitsinzani cholingotseka.',
        status: 'active',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        institutionId: null,
      },
    ];

    for (const data of announcements) {
      const announcement = this.announcementRepo.create(data);
      await this.announcementRepo.save(announcement);
    }
  }
}
