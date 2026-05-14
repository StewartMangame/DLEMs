// ─────────────────────────────────────────────────────────────────────────────
// Institution: Malawi Police SACCO
// This file is the canonical "database record" for this institution.
// Add future institutions as additional files using the same InstitutionConfig shape.
// ─────────────────────────────────────────────────────────────────────────────

import type { InstitutionConfig } from './types';

export const MALAWI_POLICE_SACCO: InstitutionConfig = {
  id: 'malawi-police-sacco',
  name: 'Malawi Police SACCO',
  type: 'SACCO',
  logoUrl: '/logos/sacco.png',
  description:
    'A member-owned savings and credit cooperative serving Malawi Police Service personnel. Offers competitive loan terms exclusively to registered SACCO members.',

  // ── Membership ──────────────────────────────────────────────────────────────
  membershipRequired: true,
  membershipLabel: 'SACCO Member',
  minimumMembershipMonths: 3,

  // ── Eligibility criteria ─────────────────────────────────────────────────
  eligibleEmploymentCategories: ['sacco_member'],
  minimumMonthlyIncomeMWK: 120_000,
  minimumServiceMonths: 6,
  debtToIncomeCapPercent: 40, // 40% of net monthly income

  // ── Loan types ─────────────────────────────────────────────────────────────
  loanTypes: [
    {
      key: 'personal',
      label: 'Personal / Salary Loan',
      labelNy: 'Ngongole Ya Malipiro',
      minAmountMWK: 50_000,
      maxAmountMWK: 15_000_000,
    },
  ],

  // ── Repayment terms ─────────────────────────────────────────────────────────
  repaymentTermsMonths: [6, 12, 24, 36, 48],

  // ── Rates ───────────────────────────────────────────────────────────────────
  fixedInterestRate: 24, // 24% fixed annual rate

  // ── Repayment method ────────────────────────────────────────────────────────
  repaymentMethod: 'Salary deduction / stop order only',
  repaymentMethodNote:
    'This institution does not accept mobile money or cash payments. All repayments are made via salary deduction or stop order.',
  repaymentMethodNoteNy:
    'Malo ano salandira ndalama za foni kapena ndalama zowerengeka. Malipiro onse amachitika kudzera mu kutengera malipiro kapena stop order.',

  // ── Proof of income ─────────────────────────────────────────────────────────
  proofOfIncome: [
    { borrowerType: 'Salaried employee', accepted: 'Payslip', acceptedNy: 'Pepa la malipiro' },
    { borrowerType: 'Self-employed', accepted: 'Bank statements', acceptedNy: 'Zilembo za banki' },
    { borrowerType: 'SACCO member', accepted: 'Payslip', acceptedNy: 'Pepa la malipiro' },
    { borrowerType: 'Borrower with collateral', accepted: 'Bank statements', acceptedNy: 'Zilembo za banki' },
  ],

  // ── Other details ────────────────────────────────────────────────────────────
  collateralAccepted: true,
  turnaroundDays: '1 to 3 days',
  rejectionCommunication: 'Always communicated by phone call',
  digitalTools: 'Loan calculator available on their website and internet banking platform',

  // ── Comparison table fields ─────────────────────────────────────────────────
  comparisonFields: {
    minimumLoanMWK: 50_000,
    maximumLoanMWK: 15_000_000,
    interestRateLabel: '24% Fixed (Annual)',
    debtToIncomeCapLabel: '40% of net monthly income',
    whoCanApply: 'SACCO members only',
    membershipRequired: 'Minimum 3 months',
    proofOfIncomeShort: 'Payslip (salaried) / Bank statements (self-employed)',
  },
};
