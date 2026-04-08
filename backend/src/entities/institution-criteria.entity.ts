import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Institution } from './institution.entity';

@Entity()
export class InstitutionCriteria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  institutionId: number;

  @OneToOne(() => Institution, i => i.criteria)
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @Column('float')
  maxDtiRatio: number;

  @Column('float')
  minNetSalary: number;

  @Column('float')
  maxLoanMultiplier: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
