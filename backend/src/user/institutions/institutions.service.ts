import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from '../../entities/institution.entity';
import { InstitutionCriteria } from '../../entities/institution-criteria.entity';

// ─── Real Malawian lending institution seed data ─────────────────────────────
const SEED_INSTITUTIONS = [
  {
    name: 'National Bank of Malawi',
    type: 'BANK',
    criteria: {
      interestRate: 25,
      maxDtiRatio: 0.40,
      minNetSalary: 80_000,
      minRepaymentMonths: 3,
      maxRepaymentMonths: 60,
      processingFeePercent: 1.5,
      civilServantMultiplier: 12,
      privateMultiplier: 6,
      selfEmployedMultiplier: 4,
      saccoMemberMultiplier: 8,
      eligibleEmploymentTypes: ['civil_servant', 'private_sector', 'self_employed', 'sacco_member'],
      requiresGuarantor: false,
      requiresPayslip: true,
      notes: 'Civil servants benefit from salary deduction at source via IFMIS/GOVPAY.',
    },
  },
  {
    name: 'FDH Bank',
    type: 'BANK',
    logoUrl: '/logos/fdh.png',
    criteria: {
      interestRate: 24,
      fixedInterestRate: 24,
      interestRateLabel: '24% Fixed (Annual)',
      maxDtiRatio: 0.3,
      minNetSalary: 0,
      minRepaymentMonths: 12,
      maxRepaymentMonths: 48,
      processingFeePercent: 0,
      civilServantMultiplier: 10,
      privateMultiplier: 5,
      selfEmployedMultiplier: 0,
      saccoMemberMultiplier: 0,
      eligibleEmploymentTypes: ['civil_servant', 'private_sector'],
      requiresGuarantor: false,
      requiresPayslip: true,
      notes: 'Available for civil servants and private sector. 24% fixed interest rate.',
    },
  },
  {
    name: 'Standard Bank Malawi',
    type: 'BANK',
    criteria: {
      interestRate: 24,
      maxDtiRatio: 0.35,
      minNetSalary: 100_000,
      minRepaymentMonths: 6,
      maxRepaymentMonths: 60,
      processingFeePercent: 1.0,
      civilServantMultiplier: 12,
      privateMultiplier: 8,
      selfEmployedMultiplier: 3,
      saccoMemberMultiplier: 6,
      eligibleEmploymentTypes: ['civil_servant', 'private_sector', 'self_employed'],
      requiresGuarantor: true,
      requiresPayslip: true,
      notes: 'Best interest rate but stricter requirements.',
    },
  },
  {
    name: 'Malawi Police SACCO',
    type: 'SACCO',
    logoUrl: '/logos/sacco.png',
    criteria: {
      interestRate: 18,
      fixedInterestRate: 18,
      interestRateLabel: '18% Fixed (Annual)',
      maxDtiRatio: 0.4,
      minNetSalary: 120_000,
      minRepaymentMonths: 6,
      maxRepaymentMonths: 48,
      processingFeePercent: 0,
      civilServantMultiplier: 10,
      privateMultiplier: 10,
      selfEmployedMultiplier: 10,
      saccoMemberMultiplier: 10,
      eligibleEmploymentTypes: ['civil_servant', 'private_sector', 'self_employed', 'sacco_member'],
      requiresGuarantor: false,
      requiresPayslip: true,
      notes: 'Malawi Police SACCO is open to SACCO members only. 18% fixed interest rate.',
    },
  },
  {
    name: 'FINCA Malawi',
    type: 'MICROFINANCE',
    logoUrl: '/logos/finca.png',
    criteria: {
      interestRate: 28,
      maxDtiRatio: 0.5,
      minNetSalary: 0,
      minRepaymentMonths: 6,
      maxRepaymentMonths: 36,
      processingFeePercent: 2.5,
      civilServantMultiplier: 4,
      privateMultiplier: 4,
      selfEmployedMultiplier: 4,
      saccoMemberMultiplier: 4,
      eligibleEmploymentTypes: ['civil_servant', 'private_sector', 'self_employed', 'sacco_member'],
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
      eligibleEmploymentTypes: ['civil_servant', 'private_sector', 'self_employed', 'sacco_member'],
      requiresGuarantor: false,
      requiresPayslip: false,
      notes: 'Lowest minimum salary threshold. Flexible repayment, no payslip required. Max 24 months.',
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
