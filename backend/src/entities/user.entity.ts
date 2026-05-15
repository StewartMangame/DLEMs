import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { FinancialProfile } from './financial-profile.entity';
import { LoanApplication } from './loan-application.entity';
import { Loan } from './loan.entity';
import { Reminder } from './reminder.entity';
import { Institution } from './institution.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column({ unique: true })
  nationalId: string;

  @Column({ unique: true })
  employeeNumber: string;

  @Column()
  phone: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: 'customer' })
  role: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: 'active' })
  accountStatus: string; // 'active' | 'suspended'

  @Column({ nullable: true })
  lastActiveAt: Date;

  @Column({ nullable: true })
  suspendedAt: Date;

  @Column({ default: false })
  isInstitutionAdmin: boolean;

  @Column({ nullable: true })
  institutionId: number;

  @ManyToOne(() => Institution, (i) => i.admins)
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @Column({ nullable: true })
  bank: string;

  @Column({ nullable: true })
  department: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => FinancialProfile, (f) => f.user)
  profile: FinancialProfile;

  @OneToMany(() => LoanApplication, (l) => l.user)
  applications: LoanApplication[];

  @OneToMany(() => Loan, (l) => l.user)
  activeLoans: Loan[];

  @OneToMany(() => Reminder, (r) => r.user)
  reminders: Reminder[];
}
