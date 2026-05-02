import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Reminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  loanId: number;

  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  @Column({ default: 'PENDING' })
  status: 'PENDING' | 'SENT' | 'FAILED';

  @Column({ default: 'SMS' })
  channel: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}