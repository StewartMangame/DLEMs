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
  async checkEligibility(@Body() body: any) {
    return this.eligibilityService.checkEligibility(body);
  }
}
