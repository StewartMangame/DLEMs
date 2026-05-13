import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Institution } from './institution.entity';

@Entity()
export class InstitutionCriteria {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Institution, (inst) => inst.criteria, {
    onDelete: 'CASCADE',
  })
  institution: Institution;

  //  indexing for filtering (performance)
  @Index()
  @Column()
  employmentType: string;

  @Column('decimal')
  interestRate: number;

  @Column('decimal')
  maxDtiRatio: number;

  @Column('decimal')
  minNetSalary: number;

  @Column()
  minRepaymentMonths: number;

  @Column()
  maxRepaymentMonths: number;

  @Column('decimal')
  processingFeePercent: number;

  @Column('int')
  civilServantMultiplier: number;

  @Column('int')
  privateMultiplier: number;

  @Column('int')
  selfEmployedMultiplier: number;

  @Column('int')
  saccoMemberMultiplier: number;

  @Column('simple-array')
  eligibleEmploymentTypes: string[];

  @Column({ default: false })
  requiresGuarantor: boolean;

  @Column({ default: false })
  requiresPayslip: boolean;

  @Column('text', { nullable: true })
  notes: string;
}