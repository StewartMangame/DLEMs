// ─────────────────────────────────────────────────────────────────────────────
// Institution configuration type definitions
// All institution config files must conform to this shape.
// ─────────────────────────────────────────────────────────────────────────────

export type EmploymentCategory =
  | 'civil_servant'
  | 'private_sector'
  | 'self_employed'
  | 'sacco_member';

export interface LoanTypeConfig {
  key: string;
  label: string;
  labelNy: string;
  minAmountMWK: number;
  maxAmountMWK: number;
}

export interface ProofOfIncomeRow {
  borrowerType: string;
  accepted: string;
  acceptedNy: string;
}

export interface InstitutionConfig {
  id: string;
  name: string;
  type: string;                    // e.g. 'SACCO' | 'Commercial Bank'
  description: string;
  logoUrl?: string;

  // Membership (SACCO-specific — set minimumMembershipMonths to 0 for banks)
  membershipRequired: boolean;
  membershipLabel: string;
  minimumMembershipMonths: number;

  // Eligibility
  eligibleEmploymentCategories: EmploymentCategory[];
  minimumMonthlyIncomeMWK: number;
  minimumServiceMonths: number;
  debtToIncomeCapPercent: number;  // e.g. 30 = 30%, 40 = 40%

  // Bank-specific flags (optional — not used by SACCO institutions)
  crbCheckRequired?: boolean;
  digitalApplicationAvailable?: boolean;
  repaymentReminders?: boolean;
  creditFactors?: string[];

  // Finca-specific flags
  requiresProductSelection?: boolean;
  requiresGroupLending?: boolean;

  // Rates & Fees
  fixedInterestRate?: number; // if present, pre-fill and fix in calculator
  processingFeePercent?: number;
  insuranceFeePercent?: number;
  cashCollateralPercent?: number;
  crbFeeApplicable?: boolean;

  // Products
  loanTypes: LoanTypeConfig[];
  repaymentTermsMonths: number[];
  defaultRepaymentTermMonths?: number; // pre-selected term in calculator

  // Repayment method
  repaymentMethod: string;
  repaymentMethodNote: string;
  repaymentMethodNoteNy: string;

  // Documentation
  proofOfIncome: ProofOfIncomeRow[];

  // Other
  collateralAccepted: boolean;
  turnaroundDays: string;
  rejectionCommunication: string;
  digitalTools: string;

  // Comparison table
  comparisonFields: {
    minimumLoanMWK: number;
    maximumLoanMWK: number;
    interestRateLabel: string;
    debtToIncomeCapLabel: string;
    whoCanApply: string;
    membershipRequired: string;
    proofOfIncomeShort: string;
    crbCheck?: string;
    digitalApplication?: string;
    repaymentReminders?: string;
    repaymentPeriod?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Eligibility result types
// ─────────────────────────────────────────────────────────────────────────────

export type EligibilityStatus =
  | 'likely_eligible'
  | 'borderline'         // amber — used by banks when CRB flag is declared
  | 'not_yet_eligible'   // amber — used by SACCOs for short membership duration
  | 'not_eligible';

export interface LoanTypeResult {
  loanType: LoanTypeConfig;
  maxAffordableMWK: number; // capped to loan type max
  cappedAtMax: boolean;
}

export interface EligibilityResult {
  status: EligibilityStatus;
  institution: InstitutionConfig;
  failedRule?: string;             // human-readable English reason
  failedRuleNy?: string;           // Chichewa reason
  loanTypeResults?: LoanTypeResult[];  // present when likely_eligible or borderline
  civilServantNote?: string;       // informational — displayed as a highlighted note
  civilServantNoteNy?: string;
  profileSummary: {
    monthlyIncome: number;
    existingObligations: number;
    availableRepayment: number;
    membershipMonths?: number;     // SACCO only
    serviceMonths: number;
  };
}

/** Legacy alias — keeps existing SACCO imports compiling without changes */
export type SaccoEligibilityResult = EligibilityResult;

// ─────────────────────────────────────────────────────────────────────────────
// Intake data types — institution-specific fields collected before the check
// ─────────────────────────────────────────────────────────────────────────────

export interface SaccoIntakeData {
  isSaccoMember: boolean;
  saccoMembershipMonths: number;
  saccoName: string;
}

export interface BankIntakeData {
  hasCrbFlag: boolean | null; // null = user has not answered yet
}

export interface FincaIntakeData {
  isPartOfGroup: boolean | null;
  groupSize: number;
  ownsBusiness: boolean | null;
  hasFincaAccount: 'yes' | 'willing' | 'no' | null;
}

