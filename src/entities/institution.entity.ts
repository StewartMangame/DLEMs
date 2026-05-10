import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { InstitutionCriteria } from './institution-criteria.entity';
import { User } from './user.entity';
import { Loan } from './loan.entity';
import { FinancialProfile } from './financial-profile.entity';
import { LoanApplication } from './loan-application.entity';

@Entity()
export class Institution {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  type: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => InstitutionCriteria, c => c.institution)
  criteria: InstitutionCriteria;

  @OneToMany(() => User, u => u.institution)
  admins: User[];

  @OneToMany(() => Loan, l => l.providerInstitution)
  loans: Loan[];

  @OneToMany(() => FinancialProfile, f => f.salaryInstitution)
  profiles: FinancialProfile[];

  @OneToMany(() => LoanApplication, l => l.institution)
  applications: LoanApplication[];
}
