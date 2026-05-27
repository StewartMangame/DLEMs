import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Institution } from '../entities/institution.entity';
import { InstitutionCriteria } from '../entities/institution-criteria.entity';
import { LoanProduct } from '../entities/loan-product.entity';
import { Sacco } from '../entities/sacco.entity';
import { User } from '../entities/user.entity';
import { Loan } from '../entities/loan.entity';
import { FinancialProfile } from '../entities/financial-profile.entity';
import { LoanApplication } from '../entities/loan-application.entity';

// ─── Real Malawian lending institution seed data ─────────────────────────────
const SEED_INSTITUTIONS = [
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

const POLICE_SACCO_SEED = {
  name: 'Malawi Police SACCO',
  minMonthlyIncome: 40_000,
  minMembershipMonths: 3,
  minServiceMonths: 6,
  maxDtiRatio: 0.45,
  repaymentMethod: 'Salary deduction / stop order only',
  loanProducts: 'Personal / Salary Loan',
  collateralAccepted: true,
  turnaroundTime: '1 to 3 days',
  interestRate: 18,
  processingFeePercent: 0.5,
  minRepaymentMonths: 3,
  maxRepaymentMonths: 60,
  notes:
    'Exclusive to registered Malawi Police SACCO members. Members can access salary-based loans after meeting the minimum membership period.',
  status: 'active' as const,
};

const FINCA_VILLAGE_BANK_PRODUCT_SEED = {
  name: 'Village Bank Loan',
  minAmount: 50_000,
  maxAmount: 4_000_000,
  interestRate: 28,
  repaymentPeriods: '3,6,9,12,18,24',
  processingFeePercent: 2.5,
  insuranceFeePercent: 0.85,
  collateralRequirements:
    '10% upfront cash collateral and mutual group guarantee',
  conditions:
    'For business owners in active groups of 5 to 25 members. Requires a FINCA account and CRB review.',
  status: 'active' as const,
};

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
   * Returns only ACTIVE institutions.
   * INACTIVE records are never returned — filter applied at the query level.
   * Relations are eager-loaded so criteria fields are immediately available.
   */
  async getActiveInstitutions() {
    const institutions = await this.instRepo.find({
      where: { status: 'active', isActive: true },
      order: { name: 'ASC' },
    });

    return institutions.map((institution) => ({
      id: String(institution.id),
      name: institution.name,
      type: normalizeInstitutionType(institution.type),
      has_branches: institution.hasBranches,
      description: institution.description ?? '',
      logoUrl: institution.logoUrl ?? null,
      status: normalizeVisibleStatus(institution.status),
    }));
  }

  /**
   * Returns SACCO-type institutions with status ACTIVE or COMING_SOON.
   * INACTIVE SACCOs are excluded at the query level.
   */
  async getSaccoBranches() {
    await this.ensureDefaultSaccoBranches();

    const branches = await this.saccoRepo.find({
      order: { name: 'ASC' },
    });

    return branches
      .filter((branch) => String(branch.status).toLowerCase() !== 'inactive')
      .map((branch) => ({
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
    await this.ensureDefaultLoanProducts();

    const products = await this.productRepo.find({
      relations: ['institution'],
      order: { name: 'ASC' },
    });

    return products
      .filter((product) => {
        const status = String(product.status).toLowerCase();
        const institutionType = String(product.institution?.type || '').toLowerCase();
        const institutionName = String(product.institution?.name || '').toLowerCase();

        return (
          status !== 'inactive' &&
          institutionType === 'microfinance' &&
          institutionName.includes('finca')
        );
      })
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
      where: { id, isActive: true, status: 'active' },
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
      eligible_borrower_categories:
        institution.criteria.eligibleEmploymentTypes ??
        institution.eligibleEmploymentTypes ??
        [],
      eligibleEmploymentTypes:
        institution.criteria.eligibleEmploymentTypes ??
        institution.eligibleEmploymentTypes ??
        [],
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
    await this.removeRetiredInstitutions();

    const existingSavingsSacco = await this.instRepo.findOne({
      where: { name: 'Malawi Savings SACCO' },
    });
    if (existingSavingsSacco) {
      existingSavingsSacco.name = 'Malawi Police SACCO';
      await this.instRepo.save(existingSavingsSacco);
    }

    const count = await this.instRepo.count();
    if (count === 0) {
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

    await this.ensureDefaultSaccoBranches();
    await this.ensureDefaultLoanProducts();
  }

  private async ensureDefaultSaccoBranches() {
    const existing = await this.saccoRepo.findOne({
      where: { name: POLICE_SACCO_SEED.name },
    });
    const sacco = existing
      ? this.saccoRepo.merge(existing, POLICE_SACCO_SEED)
      : this.saccoRepo.create(POLICE_SACCO_SEED);

    await this.saccoRepo.save(sacco);
  }

  private async ensureDefaultLoanProducts() {
    const finca = await this.instRepo.findOne({
      where: { name: 'FINCA Malawi', isActive: true },
    });
    if (!finca) return;

    const existing = await this.productRepo.findOne({
      where: {
        institutionId: finca.id,
        name: FINCA_VILLAGE_BANK_PRODUCT_SEED.name,
      },
    });
    const product = existing
      ? this.productRepo.merge(existing, {
          ...FINCA_VILLAGE_BANK_PRODUCT_SEED,
          institutionId: finca.id,
        })
      : this.productRepo.create({
          ...FINCA_VILLAGE_BANK_PRODUCT_SEED,
          institutionId: finca.id,
        });

    await this.productRepo.save(product);
  }

  private async removeRetiredInstitutions() {
    const retiredNames = ['National Bank of Malawi', 'Standard Bank Malawi'];
    for (const name of retiredNames) {
      const institution = await this.instRepo.findOne({
        where: { name },
        relations: ['criteria'],
      });
      if (!institution) continue;

      await this.instRepo.manager
        .getRepository(User)
        .update({ institutionId: institution.id }, { institutionId: null });
      await this.instRepo.manager
        .getRepository(FinancialProfile)
        .update(
          { salaryInstitutionId: institution.id },
          { salaryInstitutionId: null },
        );
      const applications = await this.instRepo.manager
        .getRepository(LoanApplication)
        .find({ where: { institutionId: institution.id }, select: ['id'] });
      const applicationIds = applications.map((application) => application.id);
      if (applicationIds.length > 0) {
        await this.instRepo.manager
          .getRepository(Loan)
          .update({ applicationId: In(applicationIds) }, { applicationId: null });
      }
      await this.instRepo.manager
        .getRepository(LoanApplication)
        .delete({ institutionId: institution.id });
      await this.instRepo.manager
        .getRepository(Loan)
        .update(
          { providerInstitutionId: institution.id },
          { providerInstitutionId: null },
        );
      await this.productRepo.delete({ institutionId: institution.id });
      if (institution.criteria) {
        await this.criteriaRepo.delete({ institutionId: institution.id });
      }
      await this.instRepo.delete(institution.id);
    }
  }
}

function normalizeInstitutionType(type: string) {
  const normalized = String(type).toLowerCase();
  if (normalized === 'bank') return 'COMMERCIAL_BANK';
  if (normalized === 'microfinance') return 'MICROFINANCE';
  if (normalized === 'sacco') return 'SACCO_CATEGORY';
  return String(type).toUpperCase();
}

function normalizeVisibleStatus(status: string) {
  return String(status).toLowerCase() === 'coming_soon' ? 'COMING_SOON' : 'ACTIVE';
}

function normalizeBranchStatus(status: string) {
  return String(status).toLowerCase() === 'coming_soon' ? 'COMING_SOON' : 'ACTIVE';
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
