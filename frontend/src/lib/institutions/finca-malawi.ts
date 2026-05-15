// ─────────────────────────────────────────────────────────────────────────────
// Institution: FINCA Malawi
// ─────────────────────────────────────────────────────────────────────────────

import type { InstitutionConfig } from './types';

export const FINCA_MALAWI: InstitutionConfig = {
  id: 'finca-malawi',
  name: 'FINCA Malawi',
  type: 'Microfinance Institution',
  logoUrl: '/logos/finca.png',
  description:
    'Offers group-based loans to business owners. Currently providing Village Bank Loans, with more products coming soon.',
  logoUrl: '/logos/finca.png',

  // ── Finca-specific flags ──────────────────────────────────────────────────
  requiresProductSelection: true,
  requiresGroupLending: true,
  crbCheckRequired: true,

  // ── Rates & Fees ────────────────────────────────────────────────────────────
  fixedInterestRate: 28, // 28% per annum fixed
  processingFeePercent: 2.5,
  insuranceFeePercent: 0.85,
  cashCollateralPercent: 10,
  crbFeeApplicable: true,

  // ── Membership ──────────────────────────────────────────────────────────────
  membershipRequired: false,
  membershipLabel: '',
  minimumMembershipMonths: 0,

  // ── Eligibility criteria ─────────────────────────────────────────────────
  // Note: These will be mostly overriden/checked via FincaIntakeData in the specific engine.
  eligibleEmploymentCategories: ['self_employed', 'private_sector', 'civil_servant', 'sacco_member'], // Broad access as long as they have a business
  minimumMonthlyIncomeMWK: 0,
  minimumServiceMonths: 0,
  debtToIncomeCapPercent: 100, // Group lending often depends on group capacity, not just standard DTI. Assuming high cap or handled separately.

  // ── Loan types ─────────────────────────────────────────────────────────────
  loanTypes: [
    {
      key: 'village_bank_loan',
      label: 'Village Bank Loan',
      labelNy: 'Ngongole ya Gulu (Village Bank)',
      minAmountMWK: 50_000,
      maxAmountMWK: 4_000_000,
    },
  ],

  // ── Repayment terms ─────────────────────────────────────────────────────────
  repaymentTermsMonths: [3, 6, 9, 12, 18, 24], // flexible monthly, provided some common terms
  defaultRepaymentTermMonths: 6,

  // ── Repayment method ────────────────────────────────────────────────────────
  repaymentMethod: 'Deducted from FINCA account',
  repaymentMethodNote:
    'Repayments are deducted directly from the client’s FINCA account. Ensure sufficient funds are available before each deduction date.',
  repaymentMethodNoteNy:
    'Malipiro amatengedwa nthawi yomweyo kuchokera ku akaunti ya FINCA. Onetsetsani kuti muli ndi ndalama zokwanira tsiku lotengera lisanakwane.',

  // ── Proof of income ─────────────────────────────────────────────────────────
  proofOfIncome: [
    { borrowerType: 'Business owners in groups', accepted: 'Active business, FINCA account, Group guarantee', acceptedNy: 'Bizinesi yokhazikika, akaunti ya FINCA, chitsimikizo cha gulu' },
  ],

  // ── Other details ────────────────────────────────────────────────────────────
  collateralAccepted: false, // Wait, 10% cash collateral is required. Let's set it to true or false? "10% cash collateral required upfront"
  turnaroundDays: 'Varies',
  rejectionCommunication: 'Communicated to the group',
  digitalTools: 'Group application form',

  // ── Comparison table fields ─────────────────────────────────────────────────
  comparisonFields: {
    minimumLoanMWK: 50_000,
    maximumLoanMWK: 4_000_000,
    interestRateLabel: '28% per annum (4% per month) — fixed',
    debtToIncomeCapLabel: 'Flexible based on business group capacity',
    whoCanApply: 'Business owners in groups of 5 to 25',
    membershipRequired: 'Must be in a group',
    proofOfIncomeShort: 'Business evaluation & group guarantee',
    crbCheck: 'Required',
    repaymentPeriod: 'Flexible monthly',
  },

  // ── Optional Bank-specific ─────────────────────────────────────────────────
  creditFactors: [
    'Must be part of an active business group (5-25 members)',
    'Must actively own or run a business',
    'Must have or be willing to open a FINCA account',
    'Mutual group guarantee is required',
    '10% upfront cash collateral',
    'CRB check is required',
  ],
};
