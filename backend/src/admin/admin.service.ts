import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Institution } from '../entities/institution.entity';
import { InstitutionCriteria } from '../entities/institution-criteria.entity';
import { LoanApplication } from '../entities/loan-application.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Institution) private instRepo: Repository<Institution>,
    @InjectRepository(InstitutionCriteria) private criteriaRepo: Repository<InstitutionCriteria>,
    @InjectRepository(LoanApplication) private appRepo: Repository<LoanApplication>,
  ) {}

  async getApplications(currentUser: any, statusFilter?: string) {
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE'];
    const where: any = {};
    
    // Institution admins only see applications for their institution
    if (currentUser.role === 'admin' && currentUser.institutionId) {
      where.institutionId = currentUser.institutionId;
    }
    if (statusFilter && validStatuses.includes(statusFilter)) {
      where.status = statusFilter;
    }

    const applications = await this.appRepo.find({
      where,
      relations: ['user', 'institution'],
      order: { createdAt: 'DESC' },
    });

    // Anonymise for institution admin
    const isInstitutionAdmin = currentUser.role === 'admin' && currentUser.institutionId;
    return {
      applications: applications.map(app => ({
        ...app,
        user: isInstitutionAdmin
          ? { fullName: 'Applicant ***', employeeNumber: app.user?.employeeNumber?.slice(0, 4) + '****' }
          : app.user,
      })),
    };
  }

  async getApplication(id: number) {
    const app = await this.appRepo.findOne({ where: { id }, relations: ['user', 'institution'] });
    if (!app) throw new NotFoundException('Application not found');
    return { application: app };
  }

  async reviewApplication(currentUser: any, id: number, data: any) {
    const app = await this.appRepo.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');
    app.status = data.status; // APPROVED | REJECTED
    await this.appRepo.save(app);
    return { success: true, application: app };
  }

  async getStats(currentUser: any) {
    const where: any = {};
    if (currentUser.role === 'admin' && currentUser.institutionId) {
      where.institutionId = currentUser.institutionId;
    }

    const total = await this.appRepo.count({ where });
    const pending = await this.appRepo.count({ where: { ...where, status: 'PENDING' } });
    const approved = await this.appRepo.count({ where: { ...where, status: 'APPROVED' } });
    const rejected = await this.appRepo.count({ where: { ...where, status: 'REJECTED' } });
    const active = await this.appRepo.count({ where: { ...where, status: 'ACTIVE' } });

    return { total, pending, approved, rejected, active };
  }

  async createInstitution(data: any) {
    const inst = this.instRepo.create({ name: data.name, type: data.type, isActive: true });
    await this.instRepo.save(inst);
    const crit = this.criteriaRepo.create({
      institutionId: inst.id,
      maxDtiRatio: data.maxDtiRatio ?? 0.4,
      minNetSalary: data.minNetSalary ?? 100000,
      civilServantMultiplier: data.civilServantMultiplier ?? 10,
      privateMultiplier: data.privateMultiplier ?? 6,
      selfEmployedMultiplier: data.selfEmployedMultiplier ?? 4,
      saccoMemberMultiplier: data.saccoMemberMultiplier ?? 8,
    });
    await this.criteriaRepo.save(crit);
    return { success: true, institution: inst };
  }

  async assignAdmin(userId: number, institutionId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.role = 'admin';
    user.isInstitutionAdmin = true;
    user.institutionId = institutionId;
    await this.userRepo.save(user);
    return { success: true, user };
  }

  async updateCriteria(institutionId: number, data: any) {
    let crit = await this.criteriaRepo.findOne({ where: { institutionId } });
    if (!crit) throw new NotFoundException('Criteria not found');
    if (data.maxDtiRatio !== undefined) crit.maxDtiRatio = data.maxDtiRatio;
    if (data.minNetSalary !== undefined) crit.minNetSalary = data.minNetSalary;
    if (data.civilServantMultiplier !== undefined) crit.civilServantMultiplier = data.civilServantMultiplier;
    if (data.privateMultiplier !== undefined) crit.privateMultiplier = data.privateMultiplier;
    if (data.selfEmployedMultiplier !== undefined) crit.selfEmployedMultiplier = data.selfEmployedMultiplier;
    if (data.saccoMemberMultiplier !== undefined) crit.saccoMemberMultiplier = data.saccoMemberMultiplier;
    await this.criteriaRepo.save(crit);
    return { success: true, criteria: crit };
  }
}
