import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ type: 'text' })
  result: string;

  @Column({
    name: 'checked_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  checkedAt: Date;
}
