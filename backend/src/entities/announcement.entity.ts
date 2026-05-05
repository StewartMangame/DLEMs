import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type AnnouncementStatus = 'draft' | 'active' | 'expired';

@Entity('announcement')
export class Announcement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  messageEnglish: string;

  @Column({ type: 'text', nullable: true })
  messageChichewa: string;

  @Column({ nullable: true })
  startDate: Date;

  @Column()
  expiryDate: Date;

  @Column({ type: 'text', default: 'draft' })
  status: AnnouncementStatus;

  /** Optional — if set, only shows on the specific institution's card */
  @Column({ nullable: true })
  institutionId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
