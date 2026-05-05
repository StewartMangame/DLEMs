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

export type LoanProductStatus = 'active' | 'inactive' | 'coming_soon';

@Entity('loan_product')
export class LoanProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  institutionId: number;

  @ManyToOne(() => Institution, { eager: false, nullable: false })
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @Column()
  name: string;

  @Column({ type: 'float', default: 0 })
  minAmount: number;

  @Column({ type: 'float', default: 0 })
  maxAmount: number;

  /** Null = user-entered / unknown */
  @Column({ type: 'float', nullable: true })
  interestRate: number;

  /** Comma-separated list of month options, e.g. "12,24,36,60" */
  @Column({ nullable: true })
  repaymentPeriods: string;

  @Column({ type: 'float', default: 0 })
  processingFeePercent: number;

  @Column({ type: 'float', default: 0 })
  insuranceFeePercent: number;

  @Column({ nullable: true })
  collateralRequirements: string;

  @Column({ type: 'text', nullable: true })
  conditions: string;

  @Column({ type: 'text', default: 'active' })
  status: LoanProductStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
