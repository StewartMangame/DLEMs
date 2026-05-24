import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { InstitutionsService } from './institutions.service';

@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly instService: InstitutionsService) {}

  /**
   * GET /api/institutions
   * Public — returns all active institutions for the user selection screen.
   * INACTIVE records are excluded at the database query level.
   */
  @Get()
  async getInstitutions() {
    return this.instService.getActiveInstitutions();
  }

  /**
   * GET /api/institutions/sacco/branches
   * Public — returns all SACCO branches with status ACTIVE or COMING_SOON.
   * INACTIVE branches are excluded.
   */
  @Get('sacco/branches')
  async getSaccoBranches() {
    return this.instService.getSaccoBranches();
  }

  /**
   * GET /api/institutions/finca/products
   * Public — returns all FINCA loan products with status ACTIVE or COMING_SOON.
   * INACTIVE products are excluded.
   */
  @Get('finca/products')
  async getFincaProducts() {
    return this.instService.getFincaProducts();
  }

  /**
   * GET /api/institutions/:id/criteria
   * Public — returns full eligibility criteria for a single institution.
   * Returns 404 if the institution does not exist or is missing required criteria.
   */
  @Get(':id/criteria')
  async getInstitutionCriteria(@Param('id') id: string) {
    const criteria = await this.instService.getInstitutionCriteria(+id);
    if (!criteria) {
      throw new NotFoundException(
        `Institution with ID ${id} not found or is missing required criteria.`,
      );
    }
    return criteria;
  }
}
