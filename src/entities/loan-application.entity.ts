import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { Institution } from './institution.entity';
import { Loan } from './loan.entity';

@Entity()
export class LoanApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, u => u.applications)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  institutionId: number;

  @ManyToOne(() => Institution, i => i.applications)
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @Column('float')
  amount: number;

  @Column('text')
  purpose: string;

  @Column()
  durationMonths: number;

  @Column('float')
  monthlyInstallment: number;

  @Column({ default: 0 })
  riskScore: number;

  @Column({ default: 'UNKNOWN' })
  riskCategory: string;

  @Column('float', { default: 0 })
  dtiRatio: number;

  @Column({ default: 'PENDING' }) // PENDING, APPROVED, REJECTED, ACTIVE
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Loan, l => l.application)
  loan: Loan;
}
