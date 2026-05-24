import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Institution } from '../entities/institution.entity';
import {
  rankInstitutions,
  CheckInstitutionParams,
  EmploymentCategory,
  CompareResult,
  InstitutionEligibilityResult,
} from '../lib/eligibilityEngine';

// ─── Eligibility status sent to the user-facing frontend ────────────────────────
const ELIGIBILITY_LABELS = {
  likely_eligible: 'LIKELY_ELIGIBLE',
  borderline: 'BORDERLINE',
  not_eligible: 'NOT_ELIGIBLE',
  not_yet_eligible: 'NOT_YET_ELIGIBLE',
} as const;

function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toEmploymentTypes(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(Boolean);
      }
    } catch {
      return value
        .split(',')
        .map((type) => type.trim())
        .filter(Boolean);
    }
  }

  return [];
}

@Injectable()
export class EligibilityService {
  constructor(
    @InjectRepository(Institution) private instRepo: Repository<Institution>,
  ) {}

  // ─── POST /eligibility/check — per-institution eligibility result ─────────────
  async checkEligibility(body: {
    user_profile: {
      monthly_net_income: number;
      employment_category: string;
      length_of_service_months: number;
      existing_monthly_obligations: number;
      sacco_membership_months?: number | null;
      has_crb_flag?: boolean;
      is_business_owner?: boolean | null;
      group_size?: number | null;
      has_finca_account?: boolean | null;
      requested_amount?: number | null;
      requested_term_months?: number | null;
    };
    selected_institution_ids: string[];
  }) {
    const { user_profile: up, selected_institution_ids: rawIds } = body;

    const selectedIds = rawIds
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));

    // Load only the selected institutions (active) with their criteria
    const whereClause: FindOptionsWhere<Institution> = {
      id: In(selectedIds),
      status: In(['active', 'pending_verification']) as any,
      isActive: true,
    };
    const institutions = await this.instRepo.find({
      where: whereClause,
      relations: ['criteria'],
    });

    const employmentCategory = normalizeEmploymentCategory(
      up.employment_category,
    );

    const checkParams: CheckInstitutionParams[] = institutions
      .filter((inst) => inst.criteria)
      .map((inst) => ({
        institutionId: inst.id,
        institutionName: inst.name,
        institutionType: inst.type,
        criteria: {
          interestRate: toNumber(inst.criteria.interestRate),
          maxDtiRatio: toNumber(inst.criteria.maxDtiRatio, 0.4),
          minNetSalary: toNumber(inst.criteria.minNetSalary),
          minRepaymentMonths: toNumber(inst.criteria.minRepaymentMonths, 1),
          maxRepaymentMonths: toNumber(inst.criteria.maxRepaymentMonths, 60),
          processingFeePercent: toNumber(inst.criteria.processingFeePercent),
          civilServantMultiplier: toNumber(
            inst.criteria.civilServantMultiplier,
          ),
          privateMultiplier: toNumber(inst.criteria.privateMultiplier),
          selfEmployedMultiplier: toNumber(
            inst.criteria.selfEmployedMultiplier,
          ),
          saccoMemberMultiplier: toNumber(inst.criteria.saccoMemberMultiplier),
          eligibleEmploymentTypes: toEmploymentTypes(
            inst.criteria.eligibleEmploymentTypes,
          ),
          requiresGuarantor: inst.criteria.requiresGuarantor,
          requiresPayslip: inst.criteria.requiresPayslip,
          notes: inst.criteria.notes ?? '',
        },
        monthlyNetSalary: toNumber(up.monthly_net_income),
        existingMonthlyRepayments: toNumber(up.existing_monthly_obligations),
        employmentCategory,
        requestedAmount: toNumber(up.requested_amount),
        requestedTermMonths:
          toNumber(up.requested_term_months) ||
          Math.max(
            toNumber(inst.criteria.minRepaymentMonths, 1),
            toNumber(inst.criteria.maxRepaymentMonths, 60) / 2,
          ),
      }));

    const engineResult = rankInstitutions(checkParams);

    const results = mapEngineResults(engineResult);

    return results.map((result) => {
      const institution = institutions.find(
        (inst) => String(inst.id) === result.institution_id,
      );
      if (!institution) return result;

      if (institution.requiresCrbCheck && up.has_crb_flag) {
        return {
          ...result,
          result: 'BORDERLINE' as const,
          reason:
            'You reported a CRB flag. This lender may still review your application, but approval is not guaranteed.',
        };
      }

      if (institution.type === 'sacco') {
        if (employmentCategory !== 'sacco_member') {
          return {
            ...result,
            result: 'NOT_ELIGIBLE' as const,
            reason: 'You must be a registered SACCO member to apply here.',
          };
        }
        const membershipMonths = toNumber(up.sacco_membership_months);
        if (membershipMonths > 0 && membershipMonths < 3) {
          return {
            ...result,
            result: 'NOT_YET_ELIGIBLE' as const,
            reason:
              'Your SACCO membership is still too new. At least 3 months of membership is required.',
          };
        }
      }

      if (institution.type === 'microfinance') {
        if (up.has_crb_flag) {
          return {
            ...result,
            result: 'BORDERLINE' as const,
            reason:
              'FINCA requires a credit reference bureau report as part of the loan application. An outstanding CRB flag may affect your application.',
          };
        }
        if (up.is_business_owner === false) {
          return {
            ...result,
            result: 'NOT_ELIGIBLE' as const,
            reason:
              'This FINCA product requires an active business or income-generating activity.',
          };
        }
        if (up.group_size !== null && up.group_size !== undefined) {
          const groupSize = toNumber(up.group_size);
          if (groupSize < 5 || groupSize > 25) {
            return {
              ...result,
              result: 'NOT_ELIGIBLE' as const,
              reason:
                'FINCA Village Bank Loans are only available to groups of 5 to 25 business owners. You must be part of an active business group to apply.',
            };
          }
        }
        if (up.has_finca_account === false) {
          return {
            ...result,
            result: 'NOT_ELIGIBLE' as const,
            reason:
              'All FINCA Village Bank Loan clients must transact through a FINCA account. Repayments are deducted directly from this account.',
          };
        }
      }

      return result;
    });
  }

  // ─── POST /eligibility/compare ──────────────────────────────────────────────
  async compareInstitutions(params: {
    monthlyNetSalary: number;
    existingMonthlyRepayments: number;
    employmentCategory: EmploymentCategory;
    requestedAmount: number;
    requestedTermMonths: number;
    institutionIds?: number[]; // optional: filter to selected institutions
  }): Promise<CompareResult> {
    const {
      monthlyNetSalary,
      existingMonthlyRepayments,
      employmentCategory,
      requestedAmount,
      requestedTermMonths,
      institutionIds,
    } = params;

    // Load institutions with their criteria
    const whereClause: FindOptionsWhere<Institution> = { isActive: true };
    if (institutionIds && institutionIds.length > 0) {
      whereClause.id = In(institutionIds);
    }
    const institutions = await this.instRepo.find({
      where: whereClause,
      relations: ['criteria'],
    });

    // Build params for each institution and run the engine
    const checkParams: CheckInstitutionParams[] = institutions
      .filter((inst) => inst.criteria) // skip institutions with no criteria set
      .map((inst) => ({
        institutionId: inst.id,
        institutionName: inst.name,
        institutionType: inst.type,
        criteria: {
          interestRate: toNumber(inst.criteria.interestRate),
          maxDtiRatio: toNumber(inst.criteria.maxDtiRatio, 0.4),
          minNetSalary: toNumber(inst.criteria.minNetSalary),
          minRepaymentMonths: toNumber(inst.criteria.minRepaymentMonths, 1),
          maxRepaymentMonths: toNumber(inst.criteria.maxRepaymentMonths, 60),
          processingFeePercent: toNumber(inst.criteria.processingFeePercent),
          civilServantMultiplier: toNumber(
            inst.criteria.civilServantMultiplier,
          ),
          privateMultiplier: toNumber(inst.criteria.privateMultiplier),
          selfEmployedMultiplier: toNumber(
            inst.criteria.selfEmployedMultiplier,
          ),
          saccoMemberMultiplier: toNumber(inst.criteria.saccoMemberMultiplier),
          eligibleEmploymentTypes: toEmploymentTypes(
            inst.criteria.eligibleEmploymentTypes,
          ),
          requiresGuarantor: inst.criteria.requiresGuarantor,
          requiresPayslip: inst.criteria.requiresPayslip,
          notes: inst.criteria.notes ?? '',
        },
        monthlyNetSalary: toNumber(monthlyNetSalary),
        existingMonthlyRepayments: toNumber(existingMonthlyRepayments),
        employmentCategory,
        requestedAmount: toNumber(requestedAmount),
        requestedTermMonths: toNumber(requestedTermMonths, 1),
      }));

    return rankInstitutions(checkParams);
  }

  // ─── POST /eligibility (legacy — single institution check) ────────────────
  async checkLegacy(body: any): Promise<{
    result: InstitutionEligibilityResult | null;
    bankSimulations: InstitutionEligibilityResult[];
  }> {
    const {
      monthlySalary,
      monthlyNetSalary,
      existingLoanAmount,
      loanAmount,
      durationMonths,
      institutionId,
      employmentCategory,
    } = body;

    const salary = monthlyNetSalary || monthlySalary || 0;
    const existing = existingLoanAmount || 0;
    const category: EmploymentCategory = employmentCategory || 'private_sector';
    const amount = parseFloat(loanAmount) || 0;
    const term = parseInt(durationMonths) || 24;

    const compareResult = await this.compareInstitutions({
      monthlyNetSalary: salary,
      existingMonthlyRepayments: existing,
      employmentCategory: category,
      requestedAmount: amount,
      requestedTermMonths: term,
      institutionIds: undefined, // all institutions
    });

    const targetInstitutionId = parseInt(institutionId, 10);
    const allResults = [...compareResult.ranked, ...compareResult.ineligible];
    const targetResult =
      allResults.find((r) => r.institutionId === targetInstitutionId) ?? null;

    return {
      result: targetResult,
      bankSimulations: allResults,
    };
  }

  // ─── GET /eligibility/institutions — public institution browser ───────────
  async getInstitutionsPublic() {
    const institutions = await this.instRepo.find({
      where: { isActive: true },
      relations: ['criteria'],
    });

    return institutions.map((inst) => ({
      id: inst.id,
      name: inst.name,
      type: inst.type,
      fixedInterestRate: inst.criteria?.fixedInterestRate || null,
      criteria: inst.criteria
        ? {
            interestRate: inst.criteria.interestRate,
            fixedInterestRate: inst.criteria.fixedInterestRate,
            interestRateLabel: inst.criteria.interestRateLabel,
            minNetSalary: inst.criteria.minNetSalary,
            maxDtiRatio: inst.criteria.maxDtiRatio,
            minRepaymentMonths: inst.criteria.minRepaymentMonths,
            maxRepaymentMonths: inst.criteria.maxRepaymentMonths,
            processingFeePercent: inst.criteria.processingFeePercent,
            requiresGuarantor: inst.criteria.requiresGuarantor,
            requiresPayslip: inst.criteria.requiresPayslip,
            eligibleEmploymentTypes: inst.criteria.eligibleEmploymentTypes,
            civilServantMultiplier: inst.criteria.civilServantMultiplier,
            privateMultiplier: inst.criteria.privateMultiplier,
            selfEmployedMultiplier: inst.criteria.selfEmployedMultiplier,
            saccoMemberMultiplier: inst.criteria.saccoMemberMultiplier,
            notes: inst.criteria.notes,
          }
        : null,
    }));
  }
}

function normalizeEmploymentCategory(value: string | undefined): EmploymentCategory {
  const normalized = String(value || 'private_sector').toLowerCase();
  if (normalized === 'civil_servant') return 'civil_servant';
  if (normalized === 'self_employed') return 'self_employed';
  if (normalized === 'sacco_member') return 'sacco_member';
  return 'private_sector';
}

/**
 * Maps `rankInstitutions` engine output to the flat `[{ institution_id, result,
 * reason, … }]` shape defined by the spec for `POST /eligibility/check`.
 */
function mapEngineResults(engine: CompareResult) {
  const results: {
    institution_id: string;
    institution_name: string;
    result:
      | 'LIKELY_ELIGIBLE'
      | 'BORDERLINE'
      | 'NOT_ELIGIBLE'
      | 'NOT_YET_ELIGIBLE';
    reason: string;
    max_loan_amount: number | null;
    available_monthly_repayment: number | null;
    loan_products: {
      product_name: string;
      min_amount: number;
      max_amount: number;
    }[];
  }[] = [];

  // Build loan-product list per institution from engine result
  function buildLoanProducts(r: InstitutionEligibilityResult) {
    if (r.loanTypeResults && r.loanTypeResults.length > 0) {
      return r.loanTypeResults.map((lt) => ({
        product_name: lt.loanType.label,
        min_amount: lt.loanType.minAmountMWK,
        max_amount: lt.maxAffordableMWK,
      }));
    }
    return [
      {
        product_name: 'Standard Loan',
        min_amount: 50_000,
        max_amount: r.maxLoanAmount || 0,
      },
    ];
  }

  // Ranked institutions (eligible/borderline)
  for (const r of engine.ranked) {
    const statusKey = r.eligible ? 'likely_eligible' : 'borderline';
    results.push({
      institution_id: String(r.institutionId),
      institution_name: r.institutionName,
      result: ELIGIBILITY_LABELS[statusKey],
      reason: r.ineligibilityReason || `${r.institutionName} is eligible.`,
      max_loan_amount: r.maxLoanAmount,
      available_monthly_repayment:
        engine.profileSummary.availableRepaymentCapacity || null,
      loan_products: buildLoanProducts(r),
    });
  }

  // Ineligible institutions
  for (const r of engine.ineligible) {
    results.push({
      institution_id: String(r.institutionId),
      institution_name: r.institutionName,
      result: ELIGIBILITY_LABELS.not_eligible,
      reason: r.ineligibilityReason || `${r.institutionName} is not eligible.`,
      max_loan_amount: r.maxLoanAmount || null,
      available_monthly_repayment:
        engine.profileSummary.availableRepaymentCapacity || null,
      loan_products: buildLoanProducts(r),
    });
  }

  return results;
}
