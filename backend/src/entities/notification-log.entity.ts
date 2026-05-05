import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Reminder } from './reminder.entity';

@Entity()
export class NotificationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reminderId: number;

  @ManyToOne(() => Reminder, (r) => r.logs)
  @JoinColumn({ name: 'reminderId' })
  reminder: Reminder;

  @CreateDateColumn()
  deliveredAt: Date;

  @Column()
  channel: string;

  @Column()
  success: boolean;

  @Column({ nullable: true })
  errorMessage: string;
}
