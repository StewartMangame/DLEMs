import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from '../../entities/institution.entity';
import { InstitutionCriteria } from '../../entities/institution-criteria.entity';

// ─── Real Malawian lending institution seed data ─────────────────────────────
const SEED_INSTITUTIONS = [
  {
    name: 'FDH Bank',
    type: 'BANK',
    logoUrl: '/logos/fdh.png',
    criteria: {
      interestRate: 24, // Matches 24% Fixed in frontend
      maxDtiRatio: 0.3, // Matches 30% DTI
      minNetSalary: 0,
      minRepaymentMonths: 12,
      maxRepaymentMonths: 48,
      processingFeePercent: 0,
      civilServantMultiplier: 10,
      privateMultiplier: 5,
      selfEmployedMultiplier: 0, // Not eligible on frontend
      saccoMemberMultiplier: 0,
      eligibleEmploymentTypes: ['civil_servant', 'private_sector'],
      requiresGuarantor: false,
      requiresPayslip: true,
      notes: 'Available for civil servants and private sector. 24% fixed interest rate.',
    },
  },
  {
    name: 'Malawi Police SACCO',
    type: 'SACCO',
    logoUrl: '/logos/sacco.png',
    criteria: {
      interestRate: 24, // Matches 24% Fixed in frontend
      maxDtiRatio: 0.4, // Matches 40% DTI
      minNetSalary: 120_000,
      minRepaymentMonths: 6,
      maxRepaymentMonths: 48,
      processingFeePercent: 0,
      civilServantMultiplier: 10,
      privateMultiplier: 10,
      selfEmployedMultiplier: 10,
      saccoMemberMultiplier: 10,
      eligibleEmploymentTypes: ['civil_servant', 'private_sector', 'self_employed', 'sacco_member'], // Eligible regardless of employment type, provided they are members
      requiresGuarantor: false,
      requiresPayslip: true,
      notes: 'Malawi Police SACCO is open to SACCO members only. 24% fixed interest rate.',
    },
  },
  {
    name: 'FINCA Malawi',
    type: 'MICROFINANCE',
    logoUrl: '/logos/finca.png',
    criteria: {
      interestRate: 28, // Using a dummy rate as FINCA doesn't have a fixed rate, but needs a value
      maxDtiRatio: 0.5, // Finca DTI from frontend is 50%
      minNetSalary: 0,
      minRepaymentMonths: 6,
      maxRepaymentMonths: 36,
      processingFeePercent: 2.5, // 2.5% processing fee from frontend
      civilServantMultiplier: 4,
      privateMultiplier: 4,
      selfEmployedMultiplier: 4,
      saccoMemberMultiplier: 4,
      eligibleEmploymentTypes: ['civil_servant', 'private_sector', 'self_employed', 'sacco_member'], // All accepted
      requiresGuarantor: false,
      requiresPayslip: false,
      notes: 'Group lending required. 2.5% processing fee and 5% cash collateral required.',
    },
  },
  {
    name: 'Thato Micro-lend Solutions',
    type: 'MICROFINANCE',
    criteria: {
      interestRate: 40,
      maxDtiRatio: 0.5,
      minNetSalary: 20_000,
      minRepaymentMonths: 1,
      maxRepaymentMonths: 24,
      processingFeePercent: 4.0,
      civilServantMultiplier: 3,
      privateMultiplier: 2,
      selfEmployedMultiplier: 2,
      saccoMemberMultiplier: 3,
      eligibleEmploymentTypes: [
        'civil_servant',
        'private_sector',
        'self_employed',
        'sacco_member',
      ],
      requiresGuarantor: false,
      requiresPayslip: false,
      notes:
        'Lowest minimum salary threshold in the market. Flexible repayment with no payslip required. Maximum term of 24 months. Ideal for micro-entrepreneurs.',
    },
  },
];

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectRepository(Institution) private instRepo: Repository<Institution>,
    @InjectRepository(InstitutionCriteria)
    private criteriaRepo: Repository<InstitutionCriteria>,
  ) {}

  async getAllInstitutions() {
    return this.instRepo.find({ relations: ['criteria'] });
  }

  async findByName(name: string) {
    if (!name) return null;
    return this.instRepo.findOne({ where: { name } });
  }

  /**
   * Seeds the 6 real Malawian lending institutions on first startup.
   * If institutions already exist the seed is skipped entirely.
   */
  async seedDefaultInstitutions() {
    const count = await this.instRepo.count();
    if (count > 0) return;

    for (const data of SEED_INSTITUTIONS) {
      const inst = this.instRepo.create({
        name: data.name,
        type: data.type,
        logoUrl: (data as any).logoUrl,
        isActive: true,
      });
      await this.instRepo.save(inst);

      const crit = this.criteriaRepo.create({
        ...data.criteria,
        institutionId: inst.id,
      });
      await this.criteriaRepo.save(crit);
    }
  }
}
