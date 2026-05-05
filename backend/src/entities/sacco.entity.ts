import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type SaccoStatus = 'active' | 'inactive';

@Entity('sacco')
export class Sacco {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'float', default: 50000 })
  minMonthlyIncome: number;

  @Column({ default: 12 })
  minMembershipMonths: number;

  @Column({ default: 6 })
  minServiceMonths: number;

  @Column({ type: 'float', default: 0.4 })
  maxDtiRatio: number;

  @Column({ default: 'Salary Deduction' })
  repaymentMethod: string;

  @Column({ default: 'Group or Individual' })
  loanProducts: string;

  @Column({ default: false })
  collateralAccepted: boolean;

  @Column({ default: '7 working days' })
  turnaroundTime: string;

  /** Annual interest rate % */
  @Column({ type: 'float', default: 18 })
  interestRate: number;

  @Column({ type: 'float', default: 0 })
  processingFeePercent: number;

  @Column({ default: 3 })
  minRepaymentMonths: number;

  @Column({ default: 60 })
  maxRepaymentMonths: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', default: 'active' })
  status: SaccoStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
