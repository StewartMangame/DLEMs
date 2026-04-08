import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Institution } from './institution.entity';
import { LoanApplication } from './loan-application.entity';
import { Reminder } from './reminder.entity';

@Entity()
export class Loan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, u => u.activeLoans)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  providerInstitutionId: number;

  @ManyToOne(() => Institution, i => i.loans)
  @JoinColumn({ name: 'providerInstitutionId' })
  providerInstitution: Institution;

  @Column('float')
  loanAmount: number;

  @Column('float')
  monthlyDeduction: number;

  @Column()
  loanTermMonths: number;

  @Column()
  startDate: Date;

  @Column('float', { nullable: true })
  remainingBalance: number;

  @Column({ default: 0 })
  paidMonths: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  applicationId: number;

  @OneToOne(() => LoanApplication, a => a.loan)
  @JoinColumn({ name: 'applicationId' })
  application: LoanApplication;

  @OneToMany(() => Reminder, r => r.loan)
  reminders: Reminder[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
