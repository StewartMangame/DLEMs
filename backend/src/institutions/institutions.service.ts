import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from '../entities/institution.entity';
import { InstitutionCriteria } from '../entities/institution-criteria.entity';

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectRepository(Institution) private instRepo: Repository<Institution>,
    @InjectRepository(InstitutionCriteria) private criteriaRepo: Repository<InstitutionCriteria>,
  ) {}

  async getAllInstitutions() {
    return this.instRepo.find({ relations: ['criteria'] });
  }

  async findByName(name: string) {
    if (!name) return null;
    return this.instRepo.findOne({ where: { name } });
  }

  async seedDefautInstitutions() {
    const count = await this.instRepo.count();
    if (count > 0) return;

    const banks = [
      { name: 'National Bank of Malawi', type: 'BANK', criteria: { maxDtiRatio: 0.40, minNetSalary: 100000, maxLoanMultiplier: 12 } },
      { name: 'Standard Bank Malawi', type: 'BANK', criteria: { maxDtiRatio: 0.35, minNetSalary: 150000, maxLoanMultiplier: 10 } },
      { name: 'FDH Bank', type: 'BANK', criteria: { maxDtiRatio: 0.33, minNetSalary: 75000, maxLoanMultiplier: 15 } }
    ];

    for (const b of banks) {
      const inst = this.instRepo.create({ name: b.name, type: b.type, isActive: true });
      await this.instRepo.save(inst);
      const crit = this.criteriaRepo.create({ ...b.criteria, institutionId: inst.id });
      await this.criteriaRepo.save(crit);
    }
  }
}
