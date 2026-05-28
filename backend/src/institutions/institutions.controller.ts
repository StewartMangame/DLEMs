import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { InstitutionsService } from './institutions.service';

@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly instService: InstitutionsService) {}

  /**
   * GET /api/institutions
   * Public - returns all active institutions for the user selection screen.
   */
  @Get()
  async getInstitutions() {
    return this.instService.getActiveInstitutions();
  }

  /**
   * GET /api/institutions/finca/products
   * Public - returns all FINCA loan products with status ACTIVE or COMING_SOON.
   */
  @Get('finca/products')
  async getFincaProducts() {
    return this.instService.getFincaProducts();
  }

  /**
   * GET /api/institutions/:id/criteria
   * Public - returns full eligibility criteria for a single institution.
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
