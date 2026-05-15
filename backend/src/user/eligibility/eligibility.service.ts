import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Institution } from '../../entities/institution.entity';
import {
  rankInstitutions,
  CheckInstitutionParams,
  EmploymentCategory,
  CompareResult,
  InstitutionEligibilityResult,
} from '../lib/eligibilityEngine';

@Injectable()
export class EligibilityService {
  constructor(
    @InjectRepository(Institution) private instRepo: Repository<Institution>,
  ) {}

  // ─── POST /eligibility/compare ─────────────────────────────────────────────
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
          interestRate: inst.criteria.interestRate,
          maxDtiRatio: inst.criteria.maxDtiRatio,
          minNetSalary: inst.criteria.minNetSalary,
          minRepaymentMonths: inst.criteria.minRepaymentMonths,
          maxRepaymentMonths: inst.criteria.maxRepaymentMonths,
          processingFeePercent: inst.criteria.processingFeePercent,
          civilServantMultiplier: inst.criteria.civilServantMultiplier,
          privateMultiplier: inst.criteria.privateMultiplier,
          selfEmployedMultiplier: inst.criteria.selfEmployedMultiplier,
          saccoMemberMultiplier: inst.criteria.saccoMemberMultiplier,
          eligibleEmploymentTypes: inst.criteria.eligibleEmploymentTypes ?? [],
          requiresGuarantor: inst.criteria.requiresGuarantor,
          requiresPayslip: inst.criteria.requiresPayslip,
          notes: inst.criteria.notes ?? '',
        },
        monthlyNetSalary,
        existingMonthlyRepayments,
        employmentCategory,
        requestedAmount,
        requestedTermMonths,
      }));

    return rankInstitutions(checkParams);
  }

  // ─── POST /eligibility (legacy — single institution check) ────────────────
  async checkEligibility(params: any): Promise<{
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
    } = params;

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
