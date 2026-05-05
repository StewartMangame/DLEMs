import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Loan } from './loan.entity';
import { NotificationLog } from './notification-log.entity';

@Entity()
export class Reminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  loanId: number;

  @ManyToOne(() => Loan, (l) => l.reminders)
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column()
  userId: number;

  @ManyToOne(() => User, (u) => u.reminders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  scheduledAt: Date;

  @Column({ nullable: true })
  sentAt: Date;

  @Column()
  channel: string;

  @Column()
  status: string; // PENDING, SENT, FAILED

  @Column({ default: false })
  deductionConfirmed: boolean;

  @OneToMany(() => NotificationLog, (n) => n.reminder)
  logs: NotificationLog[];
}
