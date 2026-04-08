import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Institution } from './institution.entity';

@Entity()
export class FinancialProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @OneToOne(() => User, u => u.profile)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  employerName: string;

  @Column()
  employmentType: string;

  @Column('float')
  monthlyNetSalary: number;

  @Column({ nullable: true })
  salaryInstitutionId: number;

  @ManyToOne(() => Institution, i => i.profiles)
  @JoinColumn({ name: 'salaryInstitutionId' })
  salaryInstitution: Institution;

  @Column('float', { nullable: true })
  employmentYears: number;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  housingStatus: string;

  @Column('float', { default: 0 })
  existingLoanAmount: number;

  @Column('float', { default: 0 })
  totalBorrowedAmount: number;

  @Column('float', { default: 0 })
  bankingYears: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
