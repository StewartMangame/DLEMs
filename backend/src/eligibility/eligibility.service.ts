import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialProfile } from '../entities/financial-profile.entity';
import { Institution } from '../entities/institution.entity';

import { calculateMonthlyInstallment } from '../lib/eligibilityEngine';

@Injectable()
export class EligibilityService {
  constructor(
    @InjectRepository(FinancialProfile) private profileRepo: Repository<FinancialProfile>,
    @InjectRepository(Institution) private instRepo: Repository<Institution>,
  ) {}

  async checkEligibility(params: any) {
    const { monthlySalary, loanAmount, durationMonths, institutionId, existingLoanAmount } = params;
    
    // Monthly installment calculation using shared logic (fixed interest assumed at 15% for eligibility simulation)
    const annualRate = 15;
    const monthlyInstallment = calculateMonthlyInstallment(loanAmount, annualRate, durationMonths);
    const totalRepayable = monthlyInstallment * durationMonths;
    
    // DTI Ratio
    const totalDeductions = (existingLoanAmount || 0) + monthlyInstallment;
    const dtiRatio = (totalDeductions / monthlySalary) * 100;

    const institutions = await this.instRepo.find({ relations: ['criteria'] });
    const bankSimulations = institutions.map(inst => {
      const criteria = inst.criteria;
      if (!criteria) return { institutionId: inst.id, bank: inst.name, eligible: false, maxAmount: 0, riskLevel: 'HIGH', rate: 10 };
      
      const maxAllowedDtiDeduction = (criteria.maxDtiRatio) * monthlySalary;
      const availableCapacity = maxAllowedDtiDeduction - (existingLoanAmount || 0);
      const maxAmountByDti = availableCapacity * durationMonths;
      const maxAmountByMultiplier = monthlySalary * criteria.maxLoanMultiplier;
      const maxAmount = Math.max(0, Math.min(maxAmountByDti, maxAmountByMultiplier));
      
      const eligible = 
        monthlySalary >= criteria.minNetSalary && 
        dtiRatio <= (criteria.maxDtiRatio * 100) && 
        loanAmount <= maxAmountByMultiplier;
        
      return {
        institutionId: inst.id,
        bank: inst.name,
        eligible,
        maxAmount,
        riskLevel: eligible ? 'LOW' : 'HIGH',
        rate: 15
      };
    });

    const targetBank = bankSimulations.find(b => b.institutionId === institutionId);

    return {
      result: {
        eligible: targetBank ? targetBank.eligible : false,
        monthlyInstallment,
        totalRepayable,
        dtiRatio,
        maxLoanAmount: targetBank ? targetBank.maxAmount : 0,
        riskScore: 85,
        riskCategory: 'GOOD',
        breakdown: {
          employment: 35,
          employmentYears: 20,
          age: 15,
          housing: 10,
          banking: 5
        }
      },
      bankSimulations
    };
  }
}
