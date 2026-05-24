import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  Like,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { File } from 'multer';
import { AdminUser } from '../entities/admin-user.entity';
import { AdminActivityLog } from '../entities/admin-activity-log.entity';
import { Institution } from '../entities/institution.entity';
import { InstitutionCriteria } from '../entities/institution-criteria.entity';
import { LoanProduct } from '../entities/loan-product.entity';
import { Announcement } from '../entities/announcement.entity';
import { ContentString } from '../entities/content-string.entity';
import { EligibilityCheckLog } from '../entities/eligibility-check-log.entity';
import { User } from '../entities/user.entity';
import { Loan } from '../entities/loan.entity';
import { Sacco } from '../entities/sacco.entity';

@Injectable()
export class AdminPanelService {
  constructor(
    @InjectRepository(AdminUser) private adminRepo: Repository<AdminUser>,
    @InjectRepository(AdminActivityLog)
    private logRepo: Repository<AdminActivityLog>,
    @InjectRepository(Institution) private instRepo: Repository<Institution>,
    @InjectRepository(InstitutionCriteria)
    private criteriaRepo: Repository<InstitutionCriteria>,
    @InjectRepository(LoanProduct) private productRepo: Repository<LoanProduct>,
    @InjectRepository(Announcement)
    private announcementRepo: Repository<Announcement>,
    @InjectRepository(ContentString)
    private contentRepo: Repository<ContentString>,
    @InjectRepository(EligibilityCheckLog)
    private eligCheckRepo: Repository<EligibilityCheckLog>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Loan) private loanRepo: Repository<Loan>,
    @InjectRepository(Sacco) private saccoRepo: Repository<Sacco>,
  ) {}

  // ─── Activity Logging ──────────────────────────────────────────────────────
  private async log(
    adminId: number,
    action: string,
    opts: {
      entityType?: string;
      entityId?: string;
      description?: string;
      fieldChanged?: string;
      oldValue?: string;
      newValue?: string;
    } = {},
  ) {
    const entry = this.logRepo.create({ adminId, action, ...opts });
    await this.logRepo.save(entry);
  }

  requireSuper(admin: any) {
    if (admin.role !== 'super_admin')
      throw new ForbiddenException('Super admin only');
  }

  // ─── Dashboard ──────────────────────────────────────────────────────────────
  async getDashboard() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, usersThisWeek, usersThisMonth] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({
        where: { createdAt: MoreThanOrEqual(startOfWeek) },
      }),
      this.userRepo.count({
        where: { createdAt: MoreThanOrEqual(startOfMonth) },
      }),
    ]);

    const [checksToday, checksThisMonth] = await Promise.all([
      this.eligCheckRepo.count({
        where: { createdAt: MoreThanOrEqual(startOfDay) },
      }),
      this.eligCheckRepo.count({
        where: { createdAt: MoreThanOrEqual(startOfMonth) },
      }),
    ]);

    // Top 3 institutions by eligibility check count
    const topInstitutions = await this.eligCheckRepo
      .createQueryBuilder('e')
      .select('e.institutionName', 'name')
      .addSelect('COUNT(*)', 'count')
      .groupBy('e.institutionName')
      .orderBy('count', 'DESC')
      .limit(3)
      .getRawMany();

    const [activeInstitutions, pendingVerification] = await Promise.all([
      this.instRepo.count({ where: { isActive: true } }),
      this.instRepo.count({ where: { status: 'pending_verification' } }),
    ]);

    return {
      totalUsers,
      usersThisWeek,
      usersThisMonth,
      checksToday,
      checksThisMonth,
      topInstitutions,
      activeInstitutions,
      pendingVerification,
    };
  }

  // ─── Section 1: Institution Management ─────────────────────────────────────
  async listInstitutions(page = 1, limit = 20, search?: string, type?: string) {
    const qb = this.instRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.criteria', 'c');
    if (search) qb.andWhere('i.name LIKE :s', { s: `%${search}%` });
    if (type) qb.andWhere('i.type = :type', { type });
    qb.orderBy('i.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async getInstitution(id: number) {
    const inst = await this.instRepo.findOne({
      where: { id },
      relations: ['criteria'],
    });
    if (!inst) throw new NotFoundException('Institution not found');
    const products = await this.productRepo.find({
      where: { institutionId: id },
    });
    return { institution: inst, products };
  }

  async createInstitution(admin: any, data: any, file?: File) {
    this.requireSuper(admin);
    const inst = this.instRepo.create({
      name: data.name,
      type: data.type,
      status: data.status ?? 'active',
      isActive: data.status !== 'inactive',
      description: data.description,
      isInterestRateFixed: data.isInterestRateFixed ?? true,
      requiresCrbCheck: data.requiresCrbCheck ?? false,
      collateralAccepted: data.collateralAccepted ?? false,
      turnaroundTime: data.turnaroundTime,
      reminderAvailable: data.reminderAvailable ?? false,
      digitalApplicationAvailable: data.digitalApplicationAvailable ?? false,
      requiredDocuments: data.requiredDocuments ?? [],
      eligibleEmploymentTypes: data.eligibleEmploymentTypes ?? [],
    });
    // If an image file was uploaded, persist it to public/uploads and set logoUrl
    if (file && file.buffer) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.promises.mkdir(uploadsDir, { recursive: true });
        const safeName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const dest = path.join(uploadsDir, safeName);
        await fs.promises.writeFile(dest, file.buffer);
        inst.logoUrl = `/uploads/${safeName}`;
      } catch (e) {
        // Log error but continue without failing creation
        // eslint-disable-next-line no-console
        console.error('Failed to save uploaded logo:', e);
      }
    }
    await this.instRepo.save(inst);
    const crit = this.criteriaRepo.create({
      institutionId: inst.id,
      maxDtiRatio: data.maxDtiRatio ?? 0.4,
      minNetSalary: data.minNetSalary ?? 50000,
      interestRate: data.interestRate ?? 25,
      processingFeePercent: data.processingFeePercent ?? 0,
      minRepaymentMonths: data.minRepaymentMonths ?? 3,
      maxRepaymentMonths: data.maxRepaymentMonths ?? 60,
      civilServantMultiplier: data.civilServantMultiplier ?? 8,
      privateMultiplier: data.privateMultiplier ?? 5,
      selfEmployedMultiplier: data.selfEmployedMultiplier ?? 3,
      saccoMemberMultiplier: data.saccoMemberMultiplier ?? 6,
      requiresGuarantor: data.requiresGuarantor ?? false,
      requiresPayslip: data.requiresPayslip ?? true,
      notes: data.notes,
    });
    await this.criteriaRepo.save(crit);
    await this.log(admin.adminId, 'institution.create', {
      entityType: 'Institution',
      entityId: String(inst.id),
      description: `Created institution: ${inst.name}`,
    });
    return { success: true, institution: inst };
  }

  async updateInstitution(admin: any, id: number, data: any) {
    const inst = await this.instRepo.findOne({
      where: { id },
      relations: ['criteria'],
    });
    if (!inst) throw new NotFoundException('Institution not found');

    const changes: string[] = [];
    const fields = [
      'name',
      'type',
      'status',
      'description',
      'turnaroundTime',
      'eligibleEmploymentTypes',
      'requiresCrbCheck',
      'collateralAccepted',
      'reminderAvailable',
      'digitalApplicationAvailable',
      'isInterestRateFixed',
      'reviewDueDate',
    ];

    for (const f of fields) {
      if (data[f] !== undefined && data[f] !== (inst as any)[f]) {
        await this.log(admin.adminId, 'institution.update', {
          entityType: 'Institution',
          entityId: String(id),
          fieldChanged: f,
          oldValue: String((inst as any)[f]),
          newValue: String(data[f]),
          description: `Changed ${f} on ${inst.name}`,
        });
        (inst as any)[f] = data[f];
        changes.push(f);
      }
    }

    if (data.requiredDocuments !== undefined) {
      inst.requiredDocuments = data.requiredDocuments;
    }

    if (data.eligibleEmploymentTypes !== undefined) {
      inst.eligibleEmploymentTypes = data.eligibleEmploymentTypes;
    }

    if (data.status === 'inactive') inst.isActive = false;
    else if (data.status === 'active') inst.isActive = true;

    await this.instRepo.save(inst);

    // Update criteria fields if provided
    if (inst.criteria && data.criteria) {
      const crit = inst.criteria;
      const critFields = [
        'maxDtiRatio',
        'minNetSalary',
        'interestRate',
        'processingFeePercent',
        'minRepaymentMonths',
        'maxRepaymentMonths',
        'civilServantMultiplier',
        'privateMultiplier',
        'selfEmployedMultiplier',
        'saccoMemberMultiplier',
        'requiresGuarantor',
        'requiresPayslip',
        'notes',
        'customCriteria',
      ];
      for (const f of critFields) {
        if (
          data.criteria[f] !== undefined &&
          data.criteria[f] !== (crit as any)[f]
        ) {
          await this.log(admin.adminId, 'institution.update', {
            entityType: 'InstitutionCriteria',
            entityId: String(id),
            fieldChanged: f,
            oldValue: String((crit as any)[f]),
            newValue: String(data.criteria[f]),
            description: `Changed criteria.${f} on ${inst.name}`,
          });
          (crit as any)[f] = data.criteria[f];
        }
      }
      await this.criteriaRepo.save(crit);
    }

    return { success: true, changes };
  }

  async verifyInstitution(admin: any, id: number, reviewDueDate?: Date) {
    const inst = await this.instRepo.findOne({ where: { id } });
    if (!inst) throw new NotFoundException();
    const old = inst.status;
    inst.status = 'active';
    inst.isActive = true;
    inst.lastVerifiedAt = new Date();
    if (reviewDueDate) inst.reviewDueDate = reviewDueDate;
    await this.instRepo.save(inst);
    await this.log(admin.adminId, 'institution.verify', {
      entityType: 'Institution',
      entityId: String(id),
      fieldChanged: 'status',
      oldValue: old,
      newValue: 'active',
      description: `Verified institution: ${inst.name}`,
    });
    return { success: true };
  }

  async getInstitutionChangelog(id: number, page = 1, limit = 50) {
    const [items, total] = await this.logRepo.findAndCount({
      where: { entityId: String(id), entityType: 'Institution' },
      relations: ['admin'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  async getInstitutionsDueForReview() {
    const now = new Date();
    return this.instRepo.find({
      where: { reviewDueDate: LessThanOrEqual(now) },
    });
  }

  // ─── Loan Products ─────────────────────────────────────────────────────────
  async listProducts(institutionId: number) {
    return this.productRepo.find({
      where: { institutionId },
      order: { name: 'ASC' },
    });
  }

  async createProduct(
    admin: any,
    institutionId: number,
    data: Partial<LoanProduct>,
  ) {
    const product = this.productRepo.create({ ...data, institutionId });
    await this.productRepo.save(product);
    await this.log(admin.adminId, 'product.create', {
      entityType: 'LoanProduct',
      entityId: String(product.id),
      description: `Added loan product: ${product.name}`,
    });
    return { success: true, product };
  }

  async updateProduct(admin: any, id: number, data: any) {
    await this.productRepo.update(id, data);
    await this.log(admin.adminId, 'product.update', {
      entityType: 'LoanProduct',
      entityId: String(id),
    });
    const product = await this.productRepo.findOne({ where: { id } });
    return { success: true, product };
  }

  // ─── Section 3: User Management ────────────────────────────────────────────
  async listSaccos() {
    return this.saccoRepo.find({ order: { name: 'ASC' } });
  }

  async createSacco(admin: any, data: Partial<Sacco>) {
    this.requireSuper(admin);
    const sacco = this.saccoRepo.create({
      name: data.name,
      status: data.status ?? 'active',
      notes: data.notes,
    });
    await this.saccoRepo.save(sacco);
    await this.log(admin.adminId, 'sacco.create', {
      entityType: 'Sacco',
      entityId: String(sacco.id),
      description: `Created SACCO: ${sacco.name}`,
    });
    return { success: true, sacco };
  }

  async updateSacco(admin: any, id: number, data: Partial<Sacco>) {
    this.requireSuper(admin);
    const sacco = await this.saccoRepo.findOne({ where: { id } });
    if (!sacco) throw new NotFoundException('SACCO not found');

    this.saccoRepo.merge(sacco, {
      name: data.name ?? sacco.name,
      status: data.status ?? sacco.status,
      notes: data.notes ?? sacco.notes,
    });
    await this.saccoRepo.save(sacco);
    await this.log(admin.adminId, 'sacco.update', {
      entityType: 'Sacco',
      entityId: String(id),
      description: `Updated SACCO: ${sacco.name}`,
    });
    return { success: true, sacco };
  }

  async deleteSacco(admin: any, id: number) {
    this.requireSuper(admin);
    const sacco = await this.saccoRepo.findOne({ where: { id } });
    if (!sacco) throw new NotFoundException('SACCO not found');

    sacco.status = 'inactive';
    await this.saccoRepo.save(sacco);
    await this.log(admin.adminId, 'sacco.deactivate', {
      entityType: 'Sacco',
      entityId: String(id),
      description: `Deactivated SACCO: ${sacco.name}`,
    });
    return { success: true };
  }

  async listUsers(
    page = 1,
    limit = 20,
    search?: string,
    status?: string,
    dateFrom?: Date,
    dateTo?: Date,
  ) {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.fullName',
        'u.email',
        'u.createdAt',
        'u.lastActiveAt',
        'u.accountStatus',
        'u.role',
      ]);
    if (search)
      qb.andWhere('(u.fullName LIKE :s OR u.email LIKE :s)', {
        s: `%${search}%`,
      });
    if (status) qb.andWhere('u.accountStatus = :status', { status });
    if (dateFrom) qb.andWhere('u.createdAt >= :from', { from: dateFrom });
    if (dateTo) qb.andWhere('u.createdAt <= :to', { to: dateTo });
    qb.orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async getUserProfile(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: [
        'id',
        'fullName',
        'email',
        'createdAt',
        'lastActiveAt',
        'accountStatus',
      ],
    });
    if (!user) throw new NotFoundException();
    const loanCount = await this.loanRepo.count({ where: { userId: id } });
    return { user, loanCount };
  }

  async suspendUser(admin: any, id: number) {
    this.requireSuper(admin);
    await this.userRepo.update(id, {
      accountStatus: 'suspended',
      suspendedAt: new Date(),
    });
    await this.log(admin.adminId, 'user.suspend', {
      entityType: 'User',
      entityId: String(id),
    });
    return { success: true };
  }

  async reactivateUser(admin: any, id: number) {
    this.requireSuper(admin);
    await this.userRepo.update(id, {
      accountStatus: 'active',
      suspendedAt: null,
    });
    await this.log(admin.adminId, 'user.reactivate', {
      entityType: 'User',
      entityId: String(id),
    });
    return { success: true };
  }

  async getUserStats() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [total, thisWeek, thisMonth] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({
        where: { createdAt: MoreThanOrEqual(startOfWeek) },
      }),
      this.userRepo.count({
        where: { createdAt: MoreThanOrEqual(startOfMonth) },
      }),
    ]);
    return { total, thisWeek, thisMonth };
  }

  // ─── Section 4: Eligibility Check Monitoring ───────────────────────────────
  async getEligibilityStats(period?: string) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [today, thisWeek, thisMonth, allTime] = await Promise.all([
      this.eligCheckRepo.count({
        where: { createdAt: MoreThanOrEqual(startOfDay) },
      }),
      this.eligCheckRepo.count({
        where: { createdAt: MoreThanOrEqual(startOfWeek) },
      }),
      this.eligCheckRepo.count({
        where: { createdAt: MoreThanOrEqual(startOfMonth) },
      }),
      this.eligCheckRepo.count(),
    ]);

    const byInstitution = await this.eligCheckRepo
      .createQueryBuilder('e')
      .select('e.institutionName', 'institution')
      .addSelect('e.institutionType', 'type')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        "SUM(CASE WHEN e.result = 'eligible' THEN 1 ELSE 0 END)",
        'eligible',
      )
      .addSelect(
        "SUM(CASE WHEN e.result = 'borderline' THEN 1 ELSE 0 END)",
        'borderline',
      )
      .addSelect(
        "SUM(CASE WHEN e.result = 'ineligible' THEN 1 ELSE 0 END)",
        'ineligible',
      )
      .groupBy('e.institutionName')
      .orderBy('total', 'DESC')
      .getRawMany();

    return { today, thisWeek, thisMonth, allTime, byInstitution };
  }

  async logEligibilityCheck(
    institutionName: string,
    institutionType: string,
    result: string,
  ) {
    const entry = this.eligCheckRepo.create({
      institutionName,
      institutionType,
      result,
    });
    await this.eligCheckRepo.save(entry);
  }

  // ─── Section 5: Loan Tracking Monitoring ──────────────────────────────────
  async getLoanStats() {
    const total = await this.loanRepo.count();
    const active = await this.loanRepo.count({ where: { isActive: true } });
    const completed = total - active;

    const byInstitution = await this.loanRepo
      .createQueryBuilder('l')
      .leftJoin('l.providerInstitution', 'i')
      .select('COALESCE(i.name, l.providerName)', 'institution')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(l.loanAmount)', 'avgAmount')
      .groupBy('institution')
      .orderBy('count', 'DESC')
      .getRawMany();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = await this.loanRepo.count({
      where: { createdAt: MoreThanOrEqual(startOfMonth) },
    });

    return { total, active, completed, byInstitution, thisMonth };
  }

  // ─── Section 6: Announcements ──────────────────────────────────────────────
  async listContent(page = 1, limit = 50, status?: string, search?: string) {
    const qb = this.contentRepo.createQueryBuilder('c');
    if (status) qb.andWhere('c.status = :status', { status });
    if (search) {
      qb.andWhere(
        '(c.key LIKE :search OR c.english LIKE :search OR c.chichewa LIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }
    qb.orderBy('c.key', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async createContent(admin: any, data: Partial<ContentString>) {
    const content = this.contentRepo.create({
      key: data.key,
      english: data.english,
      chichewa: data.chichewa,
      status: data.status ?? 'placeholder',
    });
    await this.contentRepo.save(content);
    await this.log(admin.adminId, 'content.create', {
      entityType: 'ContentString',
      entityId: String(content.id),
      description: `Created content string: ${content.key}`,
    });
    return { success: true, content };
  }

  async updateContent(admin: any, id: number, data: Partial<ContentString>) {
    const content = await this.contentRepo.findOne({ where: { id } });
    if (!content) throw new NotFoundException('Content string not found');

    this.contentRepo.merge(content, data);
    await this.contentRepo.save(content);
    await this.log(admin.adminId, 'content.update', {
      entityType: 'ContentString',
      entityId: String(id),
      description: `Updated content string: ${content.key}`,
    });
    return { success: true, content };
  }

  async listAnnouncements(page = 1, limit = 20) {
    const [items, total] = await this.announcementRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  async createAnnouncement(admin: any, data: Partial<Announcement>) {
    const a = this.announcementRepo.create(data);
    await this.announcementRepo.save(a);
    await this.log(admin.adminId, 'announcement.create', {
      entityType: 'Announcement',
      entityId: String(a.id),
    });
    return { success: true, announcement: a };
  }

  async updateAnnouncement(admin: any, id: number, data: any) {
    await this.announcementRepo.update(id, data);
    await this.log(admin.adminId, 'announcement.update', {
      entityType: 'Announcement',
      entityId: String(id),
    });
    return { success: true };
  }

  // ─── Section 9: Admin Account Management (Super Admin only) ────────────────
  async listAdmins() {
    return this.adminRepo.find({
      select: [
        'id',
        'fullName',
        'email',
        'role',
        'isActive',
        'lastLoginAt',
        'createdAt',
      ],
    });
  }

  async createAdmin(
    admin: any,
    data: Partial<AdminUser> & { password?: string },
  ) {
    this.requireSuper(admin);
    const passwordHash = await bcrypt.hash(data.password || '', 10);
    const newAdmin = this.adminRepo.create({ ...data, passwordHash });
    await this.adminRepo.save(newAdmin);
    await this.log(admin.adminId, 'admin.create', {
      entityType: 'AdminUser',
      entityId: String(newAdmin.id),
      description: `Created admin: ${newAdmin.email}`,
    });
    return { success: true };
  }

  async updateAdmin(
    admin: any,
    id: number,
    data: { role?: string; isActive?: boolean },
  ) {
    this.requireSuper(admin);
    await this.adminRepo.update(id, data as any);
    await this.log(admin.adminId, 'admin.update', {
      entityType: 'AdminUser',
      entityId: String(id),
    });
    return { success: true };
  }

  async getActivityLog(
    page = 1,
    limit = 50,
    adminIdFilter?: number,
    actionFilter?: string,
    dateFrom?: Date,
    dateTo?: Date,
  ) {
    const qb = this.logRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.admin', 'a');
    if (adminIdFilter) qb.andWhere('l.adminId = :aid', { aid: adminIdFilter });
    if (actionFilter)
      qb.andWhere('l.action LIKE :act', { act: `%${actionFilter}%` });
    if (dateFrom) qb.andWhere('l.createdAt >= :from', { from: dateFrom });
    if (dateTo) qb.andWhere('l.createdAt <= :to', { to: dateTo });
    qb.orderBy('l.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pages: Math.ceil(total / limit) };
  }
}
