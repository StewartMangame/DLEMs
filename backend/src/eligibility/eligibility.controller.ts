import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EligibilityService } from './eligibility.service';

@Controller('eligibility')
export class EligibilityController {
  constructor(private readonly eligibilityService: EligibilityService) {}

  /**
   * GET /eligibility/institutions
   * Public institution browser — returns all active institutions with their
   * lending criteria so the frontend can render the comparison/filter cards
   * before the user runs a comparison.
   * No auth required (pure informational endpoint).
   */
  @Get('institutions')
  async getInstitutions() {
    return this.eligibilityService.getInstitutionsPublic();
  }

  /**
   * POST /eligibility/check
   * Public — accepts a user financial profile and selected institution IDs,
   * loads all criteria from the database at request time and returns per-
   * institution eligibility results. No criteria are ever hardcoded.
   */
  @Post('check')
  async checkEligibility(
    @Body()
    body: {
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
    },
  ) {
    return this.eligibilityService.checkEligibility(body);
  }

  /**
   * POST /eligibility/compare
   * Core comparison endpoint. Accepts the user's financial profile + selected
   * institution IDs and returns ranked Top-5 eligible institutions plus
   * ineligible results with reasons.
   */
  @Post('compare')
  @UseGuards(AuthGuard('jwt'))
  async compareInstitutions(
    @Body()
    body: {
      monthlyNetSalary: number;
      existingMonthlyRepayments: number;
      employmentCategory: string;
      requestedAmount: number;
      requestedTermMonths: number;
      institutionIds?: number[];
    },
  ) {
    return this.eligibilityService.compareInstitutions(body as any);
  }

  /**
   * POST /eligibility
   * Legacy single-institution check — retained for backward compatibility
   * with the existing eligibility page.
   */
  @Post()
  async checkLegacy(@Body() body: any) {
    return this.eligibilityService.checkEligibility(body);
  }
}
