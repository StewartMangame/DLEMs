import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Institution } from './institution.entity';

export type TranslationStatus = 'translated' | 'placeholder' | 'needs_review';

@Entity('content_string')
export class ContentString {
  @PrimaryGeneratedColumn()
  id: number;

  /** Machine-readable key, e.g. 'institution.finca.description' */
  @Column({ unique: true })
  key: string;

  @Column({ type: 'text' })
  english: string;

  @Column({ type: 'text', nullable: true })
  chichewa: string;

  @Column({ type: 'text', default: 'placeholder' })
  status: TranslationStatus;

  /** Optional institution link */
  @Column({ nullable: true })
  institutionId: number;

  @ManyToOne(() => Institution, { eager: false, nullable: true })
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
