import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthGuard } from '@nestjs/passport';
import { InstitutionsService } from '../institutions/institutions.service';

@Controller('profile')
@UseGuards(AuthGuard('jwt'))
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly instService: InstitutionsService
  ) {}

  @Get()
  async getProfile(@Req() req: any) {
    const res = await this.profileService.getProfile(req.user.userId);
    if (res.profile) {
      return {
        profile: {
          ...res.profile,
          employer: res.profile.employerName,
          monthlySalary: res.profile.monthlyNetSalary,
          bank: res.profile.salaryInstitution?.name,
        }
      };
    }
    return res;
  }

  @Post()
  async updateProfile(@Req() req: any, @Body() body: any) {
    const mappedBody: any = {
      ...body,
      employerName: body.employer,
      monthlyNetSalary: body.monthlySalary,
    };

    // Map the employmentCategory field from the frontend
    if (body.employmentCategory) {
      mappedBody.employmentCategory = body.employmentCategory;
    }

    // Resolve institution if bank name provided
    if (body.bank) {
      const inst = await this.instService.findByName(body.bank);
      if (inst) {
        mappedBody.salaryInstitutionId = inst.id;
      }
    }

    return this.profileService.updateProfile(req.user.userId, mappedBody);
  }
}
