import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AdminUser } from './admin-user.entity';

@Entity('admin_activity_log')
export class AdminActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  adminId: number;

  @ManyToOne(() => AdminUser, { eager: false, nullable: false })
  @JoinColumn({ name: 'adminId' })
  admin: AdminUser;

  /** e.g. 'institution.update', 'institution.deactivate', 'sacco.add', 'user.suspend', 'translation.edit' */
  @Column()
  action: string;

  /** The entity type being modified — 'Institution', 'Sacco', 'User', 'Translation', etc. */
  @Column({ nullable: true })
  entityType: string;

  /** The ID of the entity being modified */
  @Column({ nullable: true })
  entityId: string;

  /** Human-readable description of what changed */
  @Column({ nullable: true })
  description: string;

  /** The specific field that was changed */
  @Column({ nullable: true })
  fieldChanged: string;

  @Column({ type: 'text', nullable: true })
  oldValue: string;

  @Column({ type: 'text', nullable: true })
  newValue: string;

  /** Write-only — no admin can update or delete this */
  @CreateDateColumn()
  createdAt: Date;
}
