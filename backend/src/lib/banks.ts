export interface BankCriteria {
  name: string;
  minScore: number;
  rate: number;
  maxDti: number;
  minAge: number;
  maxAge: number;
}

export const BANKS: BankCriteria[] = [
  {
    name: "FDH Bank",
    minScore: 60,
    rate: 24,
    maxDti: 50,
    minAge: 21,
    maxAge: 60,
  },
  {
    name: "National Bank of Malawi",
    minScore: 70,
    rate: 22,
    maxDti: 45,
    minAge: 25,
    maxAge: 55,
  },
  {
    name: "Standard Bank Malawi",
    minScore: 80,
    rate: 21,
    maxDti: 40,
    minAge: 25,
    maxAge: 60,
  },
];

export function getBank(name: string): BankCriteria | undefined {
  return BANKS.find(b => b.name === name);
}
