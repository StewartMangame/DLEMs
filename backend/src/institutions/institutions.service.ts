import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from '../entities/institution.entity';
import { InstitutionCriteria } from '../entities/institution-criteria.entity';

//  Real Malawian lending institution seed data 
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
      eligibleEmploymentTypes: [
        'civil_servant',
        'private_sector',
        'self_employed',
        'sacco_member',
      ],
      requiresGuarantor: false,
      requiresPayslip: true,
      notes:
        'Civil servants benefit from salary deduction at source via IFMIS/GOVPAY.',
    },
  },
  {
    name: 'FDH Bank',
    type: 'BANK',
    criteria: {
      interestRate: 24,
      fixedInterestRate: 24,
      interestRateLabel: '24% Fixed (Annual)',
      maxDtiRatio: 0.40,
      minNetSalary: 60_000,
      minRepaymentMonths: 3,
      maxRepaymentMonths: 60,
      processingFeePercent: 2.0,
      civilServantMultiplier: 10,
      privateMultiplier: 5,
      selfEmployedMultiplier: 3,
      saccoMemberMultiplier: 7,
      eligibleEmploymentTypes: [
        'civil_servant',
        'private_sector',
        'self_employed',
        'sacco_member',
      ],
      requiresGuarantor: false,
      requiresPayslip: true,
      notes: 'Flexible lending across employment categories.',
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
      eligibleEmploymentTypes: [
        'civil_servant',
        'private_sector',
        'self_employed',
      ],
      requiresGuarantor: true,
      requiresPayslip: true,
      notes: 'Best interest rate but stricter requirements.',
    },
  },
  {
    name: 'FINCA Malawi',
    type: 'MICROFINANCE',
    criteria: {
      interestRate: 36,
      maxDtiRatio: 0.50,
      minNetSalary: 30_000,
      minRepaymentMonths: 1,
      maxRepaymentMonths: 36,
      processingFeePercent: 3.0,
      civilServantMultiplier: 4,
      privateMultiplier: 3,
      selfEmployedMultiplier: 3,
      saccoMemberMultiplier: 4,
      eligibleEmploymentTypes: [
        'civil_servant',
        'private_sector',
        'self_employed',
        'sacco_member',
      ],
      requiresGuarantor: false,
      requiresPayslip: false,
      notes: 'Accessible microfinance for low-income borrowers.',
    },
  },
  {
    name: 'Thato Micro-lend Solutions',
    type: 'MICROFINANCE',
    criteria: {
      interestRate: 40,
      maxDtiRatio: 0.50,
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
      notes: 'Micro loans for low-income earners and entrepreneurs.',
    },
  },
  {
    name: 'Malawi Police SACCO',
    type: 'SACCO',
    criteria: {
      interestRate: 18,
      fixedInterestRate: 18,
      interestRateLabel: '18% Fixed (Annual)',
      maxDtiRatio: 0.45,
      minNetSalary: 40_000,
      minRepaymentMonths: 3,
      maxRepaymentMonths: 60,
      processingFeePercent: 0.5,
      civilServantMultiplier: 3,
      privateMultiplier: 3,
      selfEmployedMultiplier: 2,
      saccoMemberMultiplier: 10,
      eligibleEmploymentTypes: ['sacco_member'],
      requiresGuarantor: false,
      requiresPayslip: false,
      notes: 'Exclusive to SACCO members with best rates.',
    },
  },
];

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectRepository(Institution)
    private instRepo: Repository<Institution>,

    @InjectRepository(InstitutionCriteria)
    private criteriaRepo: Repository<InstitutionCriteria>,
  ) {}

  async getAllInstitutions() {
    return this.instRepo.find({
      relations: ['criteria'],
    });
  }

  async findByName(name: string) {
    if (!name) return null;
    return this.instRepo.findOne({ where: { name } });
  }

  //  UPDATED SEEDING (safe + proper relations + no duplication issues)
  async seedDefaultInstitutions() {
    const existing = await this.instRepo.count();
    if (existing > 0) return;

    for (const data of SEED_INSTITUTIONS) {
      // safer check per institution (prevents partial re-seed issues)
      const exists = await this.instRepo.findOne({
        where: { name: data.name },
      });

      if (exists) continue;

      const inst = this.instRepo.create({
        name: data.name,
        type: data.type,
        isActive: true,
      });

      await this.instRepo.save(inst);

      const crit = this.criteriaRepo.create({
        ...data.criteria,
        institution: inst, //  FIXED: proper relation mapping
      });

      await this.criteriaRepo.save(crit);
    }
  }
}