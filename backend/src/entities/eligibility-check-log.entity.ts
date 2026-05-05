import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Anonymised record of a single eligibility check run by a user */
@Entity('eligibility_check_log')
export class EligibilityCheckLog {
  @PrimaryGeneratedColumn()
  id: number;

  /** Institution checked — not linked by FK to avoid cascade issues */
  @Column()
  institutionName: string;

  @Column({ nullable: true })
  institutionType: string;

  /** Result: 'eligible' | 'borderline' | 'ineligible' */
  @Column()
  result: string;

  @CreateDateColumn()
  createdAt: Date;
}
