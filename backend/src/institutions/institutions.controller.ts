import { Controller, Get } from '@nestjs/common';
import { InstitutionsService } from './institutions.service';

@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly instService: InstitutionsService) {}

  @Get()
  async getInstitutions() {
    const institutions = await this.instService.getAllInstitutions();
    return { institutions };
  }
}
