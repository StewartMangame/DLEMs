import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { InstitutionCriteria } from './institution-criteria.entity';
import { User } from './user.entity';
import { Loan } from './loan.entity';
import { FinancialProfile } from './financial-profile.entity';
import { LoanApplication } from './loan-application.entity';

export type InstitutionStatus = 'active' | 'inactive' | 'pending_verification';

@Entity()
export class Institution {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  type: string; // 'BANK' | 'MICROFINANCE' | 'SACCO'

  @Column({ type: 'text', default: 'active' })
  status: InstitutionStatus;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  logoUrl: string;

  /** Which employment types this institution accepts for eligibility */
  @Column({ type: 'simple-json', nullable: true })
  eligibleEmploymentTypes: string[];

  /** Whether the interest rate is published/fixed (true) or user-entered (false) */
  @Column({ default: true })
  isInterestRateFixed: boolean;

  @Column({ default: false })
  requiresCrbCheck: boolean;

  @Column({ default: false })
  collateralAccepted: boolean;

  @Column({ nullable: true })
  turnaroundTime: string;

  @Column({ default: false })
  reminderAvailable: boolean;

  @Column({ default: false })
  digitalApplicationAvailable: boolean;

  /** JSON array of required document strings */
  @Column({ type: 'simple-json', nullable: true })
  requiredDocuments: string[];

  /** Date by which criteria should be re-verified */
  @Column({ nullable: true })
  reviewDueDate: Date;

  /** Date criteria were last verified by an admin */
  @Column({ nullable: true })
  lastVerifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => InstitutionCriteria, (c) => c.institution)
  criteria: InstitutionCriteria;

  @OneToMany(() => User, (u) => u.institution)
  admins: User[];

  @OneToMany(() => Loan, (l) => l.providerInstitution)
  loans: Loan[];

  @OneToMany(() => FinancialProfile, (f) => f.salaryInstitution)
  profiles: FinancialProfile[];

  @OneToMany(() => LoanApplication, (l) => l.institution)
  applications: LoanApplication[];
}
