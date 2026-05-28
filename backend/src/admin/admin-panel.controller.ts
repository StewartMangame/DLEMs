import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  BadRequestException,
  Param,
  Query,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminPanelService } from './admin-panel.service';
import {
  CreateInstitutionDto,
  UpdateInstitutionDto,
  VerifyInstitutionDto,
} from './dto/institution.dto';
import { CreateProductDto, UpdateProductDto } from './dto/loan-product.dto';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from './dto/announcement.dto';
import { CreateAdminDto, UpdateAdminDto } from './dto/admin-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

import { File } from 'multer';

const Guard = () => UseGuards(AuthGuard('admin-jwt'));

const LOGO_UPLOAD_OPTIONS = {
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req: any, file: File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    const allowedExtensions = /\.(jpe?g|png|svg)$/i;
    if (
      allowedMimeTypes.includes(file.mimetype) &&
      allowedExtensions.test(file.originalname)
    ) {
      cb(null, true);
      return;
    }
    cb(
      new BadRequestException(
        'Please upload a valid image file (JPG, PNG, or SVG).',
      ) as any,
      false,
    );
  },
};

@Controller(['admin-panel', 'admin'])
@UseGuards(AuthGuard('admin-jwt'))
export class AdminPanelController {
  constructor(private readonly svc: AdminPanelService) {}

  // ── Dashboard ──────────────────────────────────────────────────────────────
  @Get('dashboard')
  getDashboard() {
    return this.svc.getDashboard();
  }

  // ── Section 1: Institutions ────────────────────────────────────────────────
  @Get('institutions')
  listInstitutions(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('type') type?: string,
  ) {
    return this.svc.listInstitutions(+page, +limit, search, type);
  }

  @Get('institutions/review-due')
  getInstitutionsDueForReview() {
    return this.svc.getInstitutionsDueForReview();
  }

  @Get('institutions/:id')
  getInstitution(@Param('id') id: string) {
    return this.svc.getInstitution(+id);
  }

  @Post('institutions')
  @UseInterceptors(FileInterceptor('logo', LOGO_UPLOAD_OPTIONS))
  createInstitution(
    @Req() req: any,
    @Body() body: CreateInstitutionDto,
    @UploadedFile() file?: File,
  ) {
    // If eligibleEmploymentTypes was sent as a JSON string (multipart/form-data), parse it.
    if (
      body &&
      (body as any).eligibleEmploymentTypes &&
      typeof (body as any).eligibleEmploymentTypes === 'string'
    ) {
      try {
        (body as any).eligibleEmploymentTypes = JSON.parse(
          (body as any).eligibleEmploymentTypes,
        );
      } catch (e) {
        // ignore parse errors; validation will catch wrong types
      }
    }
    return this.svc.createInstitution(req.user, body, file);
  }

  @Put('institutions/:id')
  @UseInterceptors(FileInterceptor('logo', LOGO_UPLOAD_OPTIONS))
  updateInstitution(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file?: File,
  ) {
    if (
      body &&
      (body as any).eligibleEmploymentTypes &&
      typeof (body as any).eligibleEmploymentTypes === 'string'
    ) {
      try {
        (body as any).eligibleEmploymentTypes = JSON.parse(
          (body as any).eligibleEmploymentTypes,
        );
      } catch (e) {
        // ignore parse errors; validation will catch wrong types
      }
    }
    if (body && typeof body.criteria === 'string') {
      try {
        body.criteria = JSON.parse(body.criteria);
      } catch (e) {
        // leave as-is; service will ignore invalid criteria objects
      }
    }
    for (const key of [
      'isInterestRateFixed',
      'requiresCrbCheck',
      'collateralAccepted',
      'reminderAvailable',
      'digitalApplicationAvailable',
      'removeLogo',
    ]) {
      if (body[key] === 'true') body[key] = true;
      if (body[key] === 'false') body[key] = false;
    }
    return this.svc.updateInstitution(req.user, +id, body, file);
  }

  @Patch('institutions/:id/status')
  updateInstitutionStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.svc.updateInstitution(req.user, +id, { status: body.status });
  }

  @Post('institutions/:id/verify')
  verifyInstitution(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: VerifyInstitutionDto,
  ) {
    return this.svc.verifyInstitution(
      req.user,
      +id,
      body.reviewDueDate ? new Date(body.reviewDueDate) : undefined,
    );
  }

  @Get('institutions/:id/changelog')
  getInstitutionChangelog(@Param('id') id: string, @Query('page') page = '1') {
    return this.svc.getInstitutionChangelog(+id, +page);
  }

  // Loan Products
  @Get('institutions/:id/products')
  listProducts(@Param('id') id: string) {
    return this.svc.listProducts(+id);
  }

  @Post('institutions/:id/products')
  createProduct(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: CreateProductDto,
  ) {
    return this.svc.createProduct(req.user, +id, body);
  }

  @Post('institutions/:id/branches')
  createBranchOrProduct(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.svc.createBranchOrProduct(req.user, +id, body);
  }

  @Put('products/:id')
  updateProduct(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.svc.updateProduct(req.user, +id, body);
  }

  @Put('branches/:id')
  updateBranchOrProduct(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.svc.updateBranchOrProduct(req.user, +id, body);
  }

  @Patch('branches/:id/status')
  updateBranchOrProductStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.svc.updateBranchOrProduct(req.user, +id, {
      status: body.status,
    });
  }

  // ── Section 2: SACCOs ──────────────────────────────────────────────────────
  @Get('saccos')
  listSaccos() {
    throw new BadRequestException(
      'SACCOs are managed as standalone institutions.',
    );
  }

  @Post('saccos')
  createSacco() {
    throw new BadRequestException(
      'Add SACCOs from the Add Institution form.',
    );
  }

  @Put('saccos/:id')
  updateSacco() {
    throw new BadRequestException(
      'SACCOs are managed as standalone institutions.',
    );
  }

  @Delete('saccos/:id')
  deactivateSacco() {
    throw new BadRequestException(
      'SACCOs are managed as standalone institutions.',
    );
  }

  // ── Section 3: Users ───────────────────────────────────────────────────────
  @Get('users')
  listUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.svc.listUsers(
      +page,
      +limit,
      search,
      status,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  @Get('users/stats')
  getUserStats() {
    return this.svc.getUserStats();
  }

  @Get('users/:id')
  getUserProfile(@Param('id') id: string) {
    return this.svc.getUserProfile(+id);
  }

  @Post('users/:id/suspend')
  suspendUser(@Req() req: any, @Param('id') id: string) {
    return this.svc.suspendUser(req.user, +id);
  }

  @Post('users/:id/reactivate')
  reactivateUser(@Req() req: any, @Param('id') id: string) {
    return this.svc.reactivateUser(req.user, +id);
  }

  // ── Section 4: Eligibility Monitoring ─────────────────────────────────────
  @Get('eligibility/summary')
  getEligibilitySummary() {
    return this.svc.getEligibilitySummary();
  }

  @Get('eligibility/breakdown')
  getEligibilityBreakdown(@Query('period') period?: string) {
    return this.svc.getEligibilityBreakdown(period);
  }

  @Get('eligibility/stats')
  getEligibilityStats(@Query('period') period?: string) {
    return this.svc.getEligibilityStats(period);
  }

  // ── Section 5: Loan Monitoring ─────────────────────────────────────────────
  @Get('loans/stats')
  getLoanStats() {
    return this.svc.getLoanStats();
  }

  // ── Section 6: Content / Translations ─────────────────────────────────────
  @Get('content')
  listContent(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.svc.listContent(+page, +limit, status, search);
  }

  @Post('content')
  createContent(@Req() req: any, @Body() body: CreateContentDto) {
    return this.svc.createContent(req.user, body);
  }

  @Put('content/:id')
  updateContent(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateContentDto,
  ) {
    const numericId = Number(id);
    if (Number.isFinite(numericId)) {
      return this.svc.updateContent(req.user, numericId, body);
    }
    return this.svc.updateContentByKey(req.user, id, body);
  }

  // ── Section 8: Announcements ───────────────────────────────────────────────
  @Get('announcements')
  listAnnouncements(@Query('page') page = '1') {
    return this.svc.listAnnouncements(+page);
  }

  @Post('announcements')
  createAnnouncement(@Req() req: any, @Body() body: CreateAnnouncementDto) {
    return this.svc.createAnnouncement(req.user, {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      expiryDate: new Date(body.expiryDate),
    });
  }

  @Put('announcements/:id')
  updateAnnouncement(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateAnnouncementDto,
  ) {
    return this.svc.updateAnnouncement(req.user, +id, {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
    });
  }

  @Patch('announcements/:id/status')
  updateAnnouncementStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.svc.updateAnnouncement(req.user, +id, {
      status: body.status,
    });
  }

  // ── Section 9: Admin Account Management ────────────────────────────────────
  @Delete('announcements/:id')
  deleteAnnouncement(@Req() req: any, @Param('id') id: string) {
    return this.svc.deleteAnnouncement(req.user, +id);
  }

  @Get('admins')
  listAdmins(@Req() req: any) {
    this.svc.requireSuper(req.user);
    return this.svc.listAdmins();
  }

  @Post('admins')
  createAdmin(@Req() req: any, @Body() body: CreateAdminDto) {
    return this.svc.createAdmin(req.user, body);
  }

  @Put('admins/:id')
  updateAdmin(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateAdminDto,
  ) {
    return this.svc.updateAdmin(req.user, +id, body);
  }

  @Get('activity-log')
  getActivityLog(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('adminId') adminId?: string,
    @Query('action') action?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    this.svc.requireSuper(req.user);
    return this.svc.getActivityLog(
      +page,
      50,
      adminId ? +adminId : undefined,
      action,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }
}
