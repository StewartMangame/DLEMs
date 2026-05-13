import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { InstitutionCriteria } from './institution-criteria.entity';

@Entity()
export class Institution {
  @PrimaryGeneratedColumn()
  id: number;

  // prevent duplicate institutions + faster lookup
  @Index({ unique: true })
  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => InstitutionCriteria, (criteria) => criteria.institution)
  criteria: InstitutionCriteria[];
}