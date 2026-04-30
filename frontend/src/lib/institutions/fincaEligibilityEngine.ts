import type {
  InstitutionConfig,
  EligibilityResult,
  EmploymentCategory,
  FincaIntakeData,
  BankIntakeData,
} from './types';

export function runFincaEligibility(
  institution: InstitutionConfig,
  profile: {
    employmentCategory: EmploymentCategory;
    monthlyNetIncome: number;
    serviceMonths: number;
    existingMonthlyObligations: number;
    finca: FincaIntakeData;
    bank: BankIntakeData; // Finca also needs CRB from BankIntakeData
  }
): EligibilityResult {
  const availableRepayment = profile.monthlyNetIncome - profile.existingMonthlyObligations;

  const baseResult: EligibilityResult = {
    status: 'likely_eligible',
    institution,
    profileSummary: {
      monthlyIncome: profile.monthlyNetIncome,
      existingObligations: profile.existingMonthlyObligations,
      availableRepayment: Math.max(0, availableRepayment),
      serviceMonths: profile.serviceMonths,
    },
  };

  // 1. Group validation
  if (!profile.finca.isPartOfGroup || profile.finca.groupSize < 5 || profile.finca.groupSize > 25) {
    return {
      ...baseResult,
      status: 'not_eligible',
      failedRule: 'FINCA Village Bank Loans are only available to groups of 5 to 25 business owners. You must be part of an active business group to apply.',
      failedRuleNy: 'Ngongole za Village Bank za FINCA zimaperekedwa kwa magulu a anthu 5 mpaka 25 omwe ali ndi mabizinesi. Muyenera kukhala mu gulu la bizinesi kuti mupemphe ngongole.',
    };
  }

  // 2. Business ownership validation
  if (!profile.finca.ownsBusiness) {
    return {
      ...baseResult,
      status: 'not_eligible',
      failedRule: 'You must actively own or run a business to qualify for this loan.',
      failedRuleNy: 'Muyenera kukhala ndi bizinesi kapena kuyendetsa bizinesi kuti muyenerere ngongole iyi.',
    };
  }

  // 3. FINCA account validation
  if (profile.finca.hasFincaAccount === 'no') {
    return {
      ...baseResult,
      status: 'not_eligible',
      failedRule: 'All FINCA Village Bank Loan clients must transact through a FINCA account. Repayments are deducted directly from this account.',
      failedRuleNy: 'Makasitomala onse a ngongole za Village Bank za FINCA akuyenera kugwiritsa ntchito akaunti ya FINCA. Malipiro amachotsedwa mu akauntiyi.',
    };
  }

  // 4. CRB Check
  if (profile.bank.hasCrbFlag) {
    return {
      ...baseResult,
      status: 'borderline',
      failedRule: 'FINCA requires a credit reference bureau report as part of the loan application. An outstanding CRB flag may affect your application.',
      failedRuleNy: 'FINCA imafuna lipoti la credit reference bureau ngati gawo la pempho la ngongole. Zolemba za CRB zitha kukhudza pempho lanu.',
      loanTypeResults: institution.loanTypes.map(lt => ({
        loanType: lt,
        maxAffordableMWK: lt.maxAmountMWK,
        cappedAtMax: true,
      })),
    };
  }

  // If all conditions met
  return {
    ...baseResult,
    status: 'likely_eligible',
    loanTypeResults: institution.loanTypes.map(lt => ({
      loanType: lt,
      // For Village Bank Loan, maxAffordable is just the loanType max (or capacity could be calculated if given a formula)
      // Since it's per member up to 4m, we'll cap at type max.
      maxAffordableMWK: lt.maxAmountMWK,
      cappedAtMax: true,
    })),
  };
}
