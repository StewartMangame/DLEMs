import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminPanelService } from './admin-panel.service';
import { CreateInstitutionDto, UpdateInstitutionDto, VerifyInstitutionDto } from './dto/institution.dto';
import { CreateProductDto, UpdateProductDto } from './dto/loan-product.dto';
import { CreateSaccoDto, UpdateSaccoDto } from './dto/sacco.dto';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcement.dto';
import { CreateAdminDto, UpdateAdminDto } from './dto/admin-user.dto';

const Guard = () => UseGuards(AuthGuard('admin-jwt'));

@Controller('admin-panel')
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
  createInstitution(@Req() req: any, @Body() body: CreateInstitutionDto) {
    return this.svc.createInstitution(req.user, body);
  }

  @Put('institutions/:id')
  updateInstitution(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateInstitutionDto,
  ) {
    return this.svc.updateInstitution(req.user, +id, body);
  }

  @Post('institutions/:id/verify')
  verifyInstitution(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: VerifyInstitutionDto,
  ) {
    return this.svc.verifyInstitution(req.user, +id, body.reviewDueDate ? new Date(body.reviewDueDate) : undefined);
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
  createProduct(@Req() req: any, @Param('id') id: string, @Body() body: CreateProductDto) {
    return this.svc.createProduct(req.user, +id, body);
  }

  @Put('products/:id')
  updateProduct(@Req() req: any, @Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.svc.updateProduct(req.user, +id, body);
  }

  // ── Section 2: SACCOs ──────────────────────────────────────────────────────
  @Get('saccos')
  listSaccos() {
    return this.svc.listSaccos();
  }

  @Post('saccos')
  createSacco(@Req() req: any, @Body() body: CreateSaccoDto) {
    return this.svc.createSacco(req.user, body);
  }

  @Put('saccos/:id')
  updateSacco(@Req() req: any, @Param('id') id: string, @Body() body: UpdateSaccoDto) {
    return this.svc.updateSacco(req.user, +id, body);
  }

  @Delete('saccos/:id')
  deactivateSacco(@Req() req: any, @Param('id') id: string) {
    return this.svc.deleteSacco(req.user, +id);
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
  updateContent(@Req() req: any, @Param('id') id: string, @Body() body: UpdateContentDto) {
    return this.svc.updateContent(req.user, +id, body);
  }

  // ── Section 8: Announcements ───────────────────────────────────────────────
  @Get('announcements')
  listAnnouncements(@Query('page') page = '1') {
    return this.svc.listAnnouncements(+page);
  }

  @Post('announcements')
  createAnnouncement(@Req() req: any, @Body() body: CreateAnnouncementDto) {
    return this.svc.createAnnouncement(req.user, body);
  }

  @Put('announcements/:id')
  updateAnnouncement(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateAnnouncementDto,
  ) {
    return this.svc.updateAnnouncement(req.user, +id, body);
  }

  // ── Section 9: Admin Account Management ────────────────────────────────────
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
  updateAdmin(@Req() req: any, @Param('id') id: string, @Body() body: UpdateAdminDto) {
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
