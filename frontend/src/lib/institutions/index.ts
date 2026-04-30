// ─────────────────────────────────────────────────────────────────────────────
// Institution registry — import all institution configs here.
// The eligibility engine loops through whatever the user selects.
// To add a new institution: import its config and add it to INSTITUTIONS.
// ─────────────────────────────────────────────────────────────────────────────

import { MALAWI_POLICE_SACCO } from './malawi-police-sacco';
import { FDH_BANK } from './fdh-bank';
import { FINCA_MALAWI } from './finca-malawi';
import type { InstitutionConfig } from './types';

/** All available institutions. Add new entries here. */
export const INSTITUTIONS: InstitutionConfig[] = [
  MALAWI_POLICE_SACCO,
  FDH_BANK,
  FINCA_MALAWI,
  // Future: NATIONAL_BANK, NICO_LIFE, etc.
];

/** Look up an institution config by its ID */
export function getInstitutionById(id: string): InstitutionConfig | undefined {
  return INSTITUTIONS.find(inst => inst.id === id);
}

export type { InstitutionConfig } from './types';
