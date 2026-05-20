// ─────────────────────────────────────────────────────────────────────────────
// Institution: FDH Bank
// Canonical "database record" for FDH Bank.
// Follows the same InstitutionConfig shape as malawi-police-sacco.ts.
// ─────────────────────────────────────────────────────────────────────────────

import type { InstitutionConfig } from './types';

export const FDH_BANK: InstitutionConfig = {
  id: 'fdh-bank',
  name: 'FDH Bank',
  logoUrl: '/logos/fdh.png',
  type: 'Commercial Bank',
  description:
    'A leading commercial bank in Malawi offering personal and salary loans to civil servants and private sector employees. Loans are processed at physical branches with fixed interest rates and salary deduction repayment.',

  // ── Membership ──────────────────────────────────────────────────────────────
  // Banks do not require SACCO membership — set to 0 to suppress the SACCO intake form.
  membershipRequired: false,
  membershipLabel: 'N/A',
  minimumMembershipMonths: 0,

  // ── Eligibility criteria ─────────────────────────────────────────────────
  // Civil servants and private sector employees only — self-employed not accepted.
  eligibleEmploymentCategories: ['civil_servant', 'private_sector'],
  minimumMonthlyIncomeMWK: 0,   // no stated minimum — capacity is the binding constraint
  minimumServiceMonths: 6,
  debtToIncomeCapPercent: 30,   // 30% of net monthly income (differs from SACCO's 40%)

  // ── Bank-specific flags ──────────────────────────────────────────────────
  crbCheckRequired: true,
  digitalApplicationAvailable: false,
  repaymentReminders: true,
  creditFactors: [
    'Monthly salary / income — critical',
    'Existing loan obligations — critical',
    'Credit history / repayment record — critical',
    'Debt-to-income ratio — considered',
    'Age of applicant — considered',
    'Bank account history and transaction record — considered',
  ],

  // ── Loan products ──────────────────────────────────────────────────────────
  loanTypes: [
    {
      key: 'general',
      label: 'General Loan',
      labelNy: 'Ngongole Yamba',
      minAmountMWK: 200_000,
      maxAmountMWK: 10_000_000,
    },
  ],

  // ── Repayment terms ─────────────────────────────────────────────────────────
  // Standard term is 24 months — pre-select this in the calculator.
  repaymentTermsMonths: [12, 24, 36, 48],
  defaultRepaymentTermMonths: 24,

  // ── Repayment method ────────────────────────────────────────────────────────
  repaymentMethod: 'Salary deduction / stop order only',
  repaymentMethodNote:
    'This institution does not accept mobile money or cash payments. All repayments are made via salary deduction or stop order.',
  repaymentMethodNoteNy:
    'Malo ano salandira ndalama za foni kapena ndalama zowerengeka. Malipiro onse amachitika kudzera mu kutengera malipiro kapena stop order.',

  // ── Proof of income ─────────────────────────────────────────────────────────
  proofOfIncome: [
    { borrowerType: 'Civil servant / salaried employee', accepted: 'Payslip', acceptedNy: 'Pepa la malipiro' },
    { borrowerType: 'Any borrower', accepted: 'Letter of undertaking', acceptedNy: 'Kalata yovomera' },
    { borrowerType: 'Any borrower (KYC)', accepted: 'National ID', acceptedNy: 'Kadi ya dziko' },
  ],

  // ── Other details ────────────────────────────────────────────────────────────
  collateralAccepted: false,
  turnaroundDays: 'Same day to 3 days',
  rejectionCommunication: 'Always communicated',
  digitalTools: 'None',

  // ── Rates & Fees ───────────────────────────────────────────────────────────
  fixedInterestRate: 24, // 24% fixed annual rate

  // ── Comparison table fields ─────────────────────────────────────────────────
  comparisonFields: {
    minimumLoanMWK: 200_000,
    maximumLoanMWK: 10_000_000,
    interestRateLabel: '24% Fixed (Annual)',
    debtToIncomeCapLabel: '30% of net monthly income',
    whoCanApply: 'Civil servants and private sector employees',
    membershipRequired: 'Not required',
    proofOfIncomeShort: 'Payslip, Letter of undertaking, National ID',
    crbCheck: 'Always required',
    digitalApplication: 'Not available — branch only',
    repaymentReminders: 'Yes',
    repaymentPeriod: '24 months (standard)',
  },
};
