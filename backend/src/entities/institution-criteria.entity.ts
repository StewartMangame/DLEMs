import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Institution } from './institution.entity';

@Entity()
export class InstitutionCriteria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  institutionId: number;

  @OneToOne(() => Institution, (i) => i.criteria)
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  // ── Debt-to-Income ──────────────────────────────────────────────
  @Column('float')
  maxDtiRatio: number;

  // ── Salary requirements ─────────────────────────────────────────
  @Column('float')
  minNetSalary: number;

  // ── Interest & fees ─────────────────────────────────────────────
  /** Annual interest rate as a percentage, e.g. 25 for 25% */
  @Column('float', { default: 25 })
  interestRate: number;

  @Column('float', { nullable: true })
  fixedInterestRate: number;

  @Column({ nullable: true })
  interestRateLabel: string;

  /** Processing / application fee as a percentage of loan amount */
  @Column('float', { default: 0 })
  processingFeePercent: number;

  // ── Term limits (months) ─────────────────────────────────────────
  @Column({ default: 3 })
  minRepaymentMonths: number;

  @Column({ default: 60 })
  maxRepaymentMonths: number;

  // ── Employment-type salary multipliers ───────────────────────────
  /**
   * Maximum loan = salary × multiplier for each employment category.
   * Civil servants often access 12× because deductions are guaranteed at source (IFMIS/GOVPAY).
   */
  @Column('float', { default: 6 })
  civilServantMultiplier: number;

  @Column('float', { default: 4 })
  privateMultiplier: number;

  @Column('float', { default: 2 })
  selfEmployedMultiplier: number;

  @Column('float', { default: 8 })
  saccoMemberMultiplier: number;

  /**
   * JSON array of eligible employment categories.
   * Possible values: "civil_servant", "private_sector", "self_employed", "sacco_member"
   */
  @Column('simple-json', {
    default:
      '["civil_servant","private_sector","self_employed","sacco_member"]',
  })
  eligibleEmploymentTypes: string[];

  // ── Additional conditions ────────────────────────────────────────
  @Column({ default: false })
  requiresGuarantor: boolean;

  @Column({ default: true })
  requiresPayslip: boolean;

  /** Human-readable conditions / notes shown to the user */
  @Column('text', { nullable: true })
  notes: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
