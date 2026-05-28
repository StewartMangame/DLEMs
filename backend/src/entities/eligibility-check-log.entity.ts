import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

/** Anonymised aggregate record of one institution eligibility result. */
@Entity('eligibility_checks')
export class EligibilityCheckLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'institution_id', type: 'text' })
  institutionId: string;

  @Column({ name: 'institution_name', type: 'text' })
  institutionName: string;

  @Column({ name: 'institution_type', type: 'text' })
  institutionType: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'text' })
  result: string;

  @CreateDateColumn()
  checkedAt: Date;
}
