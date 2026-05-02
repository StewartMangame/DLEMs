import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class NotificationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reminderId: number;

  @Column()
  channel: string; // SMS, EMAIL, etc.

  @Column({ default: false })
  success: boolean;

  @Column({ nullable: true, type: 'text' })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}