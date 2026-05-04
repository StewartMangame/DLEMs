import { Controller, Get, Post, Body, UseGuards, Req, Param, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- Applications queue ---
  @Get('applications')
  async getApplications(@Req() req: any, @Query('status') status?: string) {
    return this.adminService.getApplications(req.user, status);
  }

  @Get('applications/:id')
  async getApplication(@Param('id') id: string) {
    return this.adminService.getApplication(parseInt(id, 10));
  }

  @Post('applications/:id')
  async reviewApplication(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.adminService.reviewApplication(req.user, parseInt(id, 10), body);
  }

  // --- Institution management (super admin) ---
  @Post('institutions')
  async createInstitution(@Req() req: any, @Body() body: any) {
    if (!['admin', 'superadmin'].includes(req.user.role)) return { error: 'Unauthorized' };
    return this.adminService.createInstitution(body);
  }

  @Post('assign-admin')
  async assignAdmin(@Req() req: any, @Body() body: any) {
    if (!['admin', 'superadmin'].includes(req.user.role)) return { error: 'Unauthorized' };
    return this.adminService.assignAdmin(body.userId, body.institutionId);
  }

  @Post('criteria/:id')
  async updateCriteria(@Req() req: any, @Param('id') institutionId: string, @Body() body: any) {
    return this.adminService.updateCriteria(parseInt(institutionId, 10), body);
  }

  // --- Stats (anonymised) for institution admin ---
  @Get('stats')
  async getStats(@Req() req: any) {
    return this.adminService.getStats(req.user);
  }
}
