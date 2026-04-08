import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { EligibilityService } from './eligibility.service';

@Controller('eligibility')
// Note: Frontend doesn't seem to pass auth token explicitly for eligibility? 
// Even if it does, let's keep it open for simulation. Oh wait, it uses fetch('/api/eligibility') with cookies.
export class EligibilityController {
  constructor(private readonly eligibilityService: EligibilityService) {}

  @Post()
  async checkEligibility(@Body() body: any) {
    return this.eligibilityService.checkEligibility(body);
  }
}
