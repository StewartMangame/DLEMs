import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from '../entities/institution.entity';
import { InstitutionCriteria } from '../entities/institution-criteria.entity';
import { LoanProduct } from '../entities/loan-product.entity';
import { Sacco } from '../entities/sacco.entity';

// ─── Real Malawian lending institution seed data ─────────────────────────────
const SEED_INSTITUTIONS = [
  {
    name: 'National Bank of Malawi',
    type: 'bank',
    hasBranches: true,
    status: 'active' as const,
    criteria: {
      interestRate: 25,
      maxDtiRatio: 0.4,
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
        'Civil servants benefit from salary deduction at source via IFMIS/GOVPAY, allowing up to 12× net salary. Payslip mandatory for all categories.',
    },
  },
  {
    name: 'FDH Bank',
    type: 'bank',
    hasBranches: true,
    status: 'active' as const,
    criteria: {
      interestRate: 28,
      maxDtiRatio: 0.4,
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
      notes:
        'Open to all employment categories. Lower minimum salary threshold than peers. Self-employed applicants require 12 months of bank statements.',
    },
  },
  {
    name: 'Standard Bank Malawi',
    type: 'bank',
    hasBranches: true,
    status: 'active' as const,
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
      notes:
        'Best interest rate among commercial banks. Higher minimum salary and guarantor required. Self-employed must provide certified business accounts.',
    },
  },
  {
    name: 'FINCA Malawi',
    type: 'microfinance',
    hasBranches: true,
    status: 'active' as const,
    criteria: {
      interestRate: 36,
      maxDtiRatio: 0.5,
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
      notes:
        'Accessible microfinance for low-income borrowers. No payslip required — alternative income evidence accepted. Group lending option available.',
    },
  },
  {
    name: 'Thato Micro-lend Solutions',
    type: 'microfinance',
    hasBranches: true,
    status: 'active' as const,
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
  {
    name: 'Malawi Police SACCO',
    type: 'sacco',
    hasBranches: true,
    status: 'active' as const,
    criteria: {
      interestRate: 18,
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
      notes:
        'Exclusive to registered police SACCO members. Best interest rate in the market at 18% p.a. Members can access up to 10× their net salary. Non-members not eligible.',
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
    @InjectRepository(Sacco)
    private saccoRepo: Repository<Sacco>,
    @InjectRepository(LoanProduct)
    private productRepo: Repository<LoanProduct>,
  ) {}

  /**
   * Returns only ACTIVE and PENDING_VERIFICATION institutions.
   * INACTIVE records are never returned — filter applied at the query level.
   * Relations are eager-loaded so criteria fields are immediately available.
   */
  async getActiveInstitutions() {
    const institutions = await this.instRepo.find({
      where: [
        { status: 'active', isActive: true },
        { status: 'pending_verification', isActive: true },
      ],
      order: { name: 'ASC' },
    });

    return institutions.map((institution) => ({
      id: String(institution.id),
      name: institution.name,
      type: normalizeInstitutionType(institution.type),
      has_branches: institution.hasBranches,
      description: institution.description ?? '',
      status: normalizeVisibleStatus(institution.status),
      pending_verification_note:
        institution.status === 'pending_verification'
          ? 'This institution is pending verification. Please confirm current terms before applying.'
          : null,
    }));
  }

  /**
   * Returns SACCO-type institutions with status ACTIVE or COMING_SOON.
   * INACTIVE SACCOs are excluded at the query level.
   */
  async getSaccoBranches() {
    const branches = await this.saccoRepo.find({
      where: [
        { status: 'active' as const },
        { status: 'coming_soon' as const },
      ],
      order: { name: 'ASC' },
    });

    return branches.map((branch) => ({
      id: String(branch.id),
      branch_name: branch.name,
      status: normalizeBranchStatus(branch.status),
    }));
  }

  /**
   * Returns FINCA (microfinance) type institutions with status ACTIVE or COMING_SOON.
   * INACTIVE products are excluded at the query level.
   */
  async getFincaProducts() {
    const products = await this.productRepo.find({
      where: [
        { status: 'active' as const },
        { status: 'coming_soon' as const },
      ],
      relations: ['institution'],
      order: { name: 'ASC' },
    });

    return products
      .filter(
        (product) =>
          product.institution?.type === 'microfinance' &&
          product.institution.name.toLowerCase().includes('finca'),
      )
      .map((product) => ({
        id: String(product.id),
        product_name: product.name,
        description: product.conditions ?? '',
        status: normalizeBranchStatus(product.status),
      }));
  }

  /**
   * Returns full eligibility criteria for a single institution by numeric ID.
   * Returns null when the institution does not exist, is INACTIVE, or has no criteria.
   * The caller (controller) turns a null response into a 404 with a clear error message.
   */
  async getInstitutionCriteria(id: number) {
    const institution = await this.instRepo.findOne({
      where: [
        { id, isActive: true, status: 'active' },
        { id, isActive: true, status: 'pending_verification' },
      ],
      relations: ['criteria'],
    });

    if (!institution || !institution.criteria) {
      return null;
    }

    if (!hasCompleteCriteria(institution)) {
      return null;
    }

    const products = await this.productRepo.find({
      where: [
        { institutionId: institution.id, status: 'active' as const },
        { institutionId: institution.id, status: 'coming_soon' as const },
      ],
      order: { name: 'ASC' },
    });
    const loanProducts = products.length
      ? products.map((product) => ({
          product_name: product.name,
          min_amount: product.minAmount,
          max_amount: product.maxAmount,
          interest_rate_fixed: product.interestRate !== null,
          interest_rate_value: product.interestRate,
          repayment_periods: parseRepaymentPeriods(
            product.repaymentPeriods,
            institution.criteria.minRepaymentMonths,
            institution.criteria.maxRepaymentMonths,
          ),
          processing_fee_percent: product.processingFeePercent,
          insurance_fee_percent: product.insuranceFeePercent ?? null,
        }))
      : [
          {
            product_name: 'Standard Loan',
            min_amount: 50_000,
            max_amount: maxLoanAmountFromCriteria(institution),
            interest_rate_fixed: institution.isInterestRateFixed,
            interest_rate_value: institution.isInterestRateFixed
              ? institution.criteria.interestRate
              : null,
            repayment_periods: parseRepaymentPeriods(
              null,
              institution.criteria.minRepaymentMonths,
              institution.criteria.maxRepaymentMonths,
            ),
            processing_fee_percent: institution.criteria.processingFeePercent,
            insurance_fee_percent: null,
          },
        ];

    return {
      id: String(institution.id),
      name: institution.name,
      type: institution.type,
      hasBranches: institution.hasBranches,
      status: institution.status,
      description: institution.description,
      logoUrl: institution.logoUrl,
      requiredDocuments: institution.requiredDocuments ?? [],
      requiresCrbCheck: institution.requiresCrbCheck ?? false,
      collateralAccepted: institution.collateralAccepted ?? false,
      turnaroundTime: institution.turnaroundTime ?? 'Varies',
      isInterestRateFixed: institution.isInterestRateFixed,
      min_income: institution.criteria.minNetSalary,
      min_service_months: 0,
      dti_cap_percent: Math.round(institution.criteria.maxDtiRatio * 100),
      loan_products: loanProducts,
      required_documents: institution.requiredDocuments ?? [],
      repayment_method: 'Salary deduction',
      collateral_accepted: institution.collateralAccepted ?? false,
      turnaround_time: institution.turnaroundTime ?? 'Varies',
      crb_check_required: institution.requiresCrbCheck ?? false,
    };
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
    const existingSavingsSacco = await this.instRepo.findOne({
      where: { name: 'Malawi Savings SACCO' },
    });
    if (existingSavingsSacco) {
      existingSavingsSacco.name = 'Malawi Police SACCO';
      await this.instRepo.save(existingSavingsSacco);
    }

    const count = await this.instRepo.count();
    if (count > 0) return;

    for (const data of SEED_INSTITUTIONS) {
      const inst = this.instRepo.create({
        name: data.name,
        type: data.type,
        status: data.status,
        isActive: true,
        hasBranches: data.hasBranches,
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

function normalizeInstitutionType(type: string) {
  if (type === 'bank') return 'COMMERCIAL_BANK';
  if (type === 'microfinance') return 'MICROFINANCE';
  if (type === 'sacco') return 'SACCO_CATEGORY';
  return type.toUpperCase();
}

function normalizeVisibleStatus(status: string) {
  return status === 'pending_verification' ? 'PENDING_VERIFICATION' : 'ACTIVE';
}

function normalizeBranchStatus(status: string) {
  return status === 'coming_soon' ? 'COMING_SOON' : 'ACTIVE';
}

function parseRepaymentPeriods(
  raw: string | null | undefined,
  minMonths: number,
  maxMonths: number,
) {
  if (raw) {
    const parsed = raw
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (parsed.length > 0) return parsed;
  }
  return Array.from(new Set([minMonths, maxMonths])).sort((a, b) => a - b);
}

function maxLoanAmountFromCriteria(institution: Institution) {
  const criteria = institution.criteria;
  return (
    criteria.minNetSalary *
    Math.max(
      criteria.civilServantMultiplier,
      criteria.privateMultiplier,
      criteria.selfEmployedMultiplier,
      criteria.saccoMemberMultiplier,
    )
  );
}

function hasCompleteCriteria(institution: Institution) {
  const criteria = institution.criteria;
  return [
    institution.name,
    institution.type,
    criteria.minNetSalary,
    criteria.maxDtiRatio,
    criteria.interestRate,
    criteria.minRepaymentMonths,
    criteria.maxRepaymentMonths,
    criteria.processingFeePercent,
  ].every((value) => value !== null && value !== undefined && value !== '');
}
