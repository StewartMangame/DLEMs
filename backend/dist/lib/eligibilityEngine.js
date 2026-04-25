"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMonthlyInstallment = calculateMonthlyInstallment;
exports.calculateMaxPrincipal = calculateMaxPrincipal;
exports.getMultiplier = getMultiplier;
exports.calculateDtiRatio = calculateDtiRatio;
exports.checkInstitution = checkInstitution;
exports.rankInstitutions = rankInstitutions;
function calculateMonthlyInstallment(amount, annualRate, months) {
    if (annualRate === 0)
        return amount / months;
    const r = annualRate / 100 / 12;
    const n = months;
    const factor = Math.pow(1 + r, n);
    return (amount * r * factor) / (factor - 1);
}
function calculateMaxPrincipal(maxMonthlyPayment, annualRate, months) {
    if (annualRate === 0)
        return maxMonthlyPayment * months;
    const r = annualRate / 100 / 12;
    const n = months;
    const factor = Math.pow(1 + r, n);
    return (maxMonthlyPayment * (factor - 1)) / (r * factor);
}
function getMultiplier(category, criteria) {
    switch (category) {
        case 'civil_servant': return criteria.civilServantMultiplier;
        case 'private_sector': return criteria.privateMultiplier;
        case 'self_employed': return criteria.selfEmployedMultiplier;
        case 'sacco_member': return criteria.saccoMemberMultiplier;
        default: return criteria.privateMultiplier;
    }
}
function calculateDtiRatio(monthlySalary, existingRepayments, newInstallment) {
    if (monthlySalary === 0)
        return 0;
    return ((existingRepayments + newInstallment) / monthlySalary) * 100;
}
function checkInstitution(p) {
    const { criteria, monthlyNetSalary, existingMonthlyRepayments, employmentCategory, requestedAmount, requestedTermMonths, } = p;
    if (!criteria.eligibleEmploymentTypes.includes(employmentCategory)) {
        return buildResult(p, false, `${p.institutionName} does not lend to ${formatCategory(employmentCategory)} employees.`);
    }
    if (monthlyNetSalary < criteria.minNetSalary) {
        return buildResult(p, false, `Minimum net salary required is MK ${criteria.minNetSalary.toLocaleString()}. Yours is MK ${monthlyNetSalary.toLocaleString()}.`);
    }
    const maxAffordableRepayment = (criteria.maxDtiRatio * monthlyNetSalary) - existingMonthlyRepayments;
    if (maxAffordableRepayment <= 0) {
        return buildResult(p, false, 'Existing loan repayments already exceed this institution\'s DTI limit.');
    }
    const clampedTerm = Math.min(Math.max(requestedTermMonths, criteria.minRepaymentMonths), criteria.maxRepaymentMonths);
    const maxByDti = calculateMaxPrincipal(maxAffordableRepayment, criteria.interestRate, clampedTerm);
    const maxByMultiplier = monthlyNetSalary * getMultiplier(employmentCategory, criteria);
    const maxLoanAmount = Math.max(0, Math.min(maxByDti, maxByMultiplier));
    if (requestedTermMonths < criteria.minRepaymentMonths || requestedTermMonths > criteria.maxRepaymentMonths) {
        return buildResult(p, false, `Repayment period must be between ${criteria.minRepaymentMonths} and ${criteria.maxRepaymentMonths} months.`, maxLoanAmount);
    }
    const requestedInstallment = calculateMonthlyInstallment(requestedAmount, criteria.interestRate, requestedTermMonths);
    const dtiIfApproved = calculateDtiRatio(monthlyNetSalary, existingMonthlyRepayments, requestedInstallment);
    const requestedAmountEligible = requestedAmount <= maxLoanAmount && dtiIfApproved <= criteria.maxDtiRatio * 100;
    const eligible = maxLoanAmount > 0;
    return {
        institutionId: p.institutionId,
        institutionName: p.institutionName,
        institutionType: p.institutionType,
        eligible,
        ineligibilityReason: eligible ? undefined : 'Insufficient borrowing capacity at this institution.',
        maxLoanAmount: Math.round(maxLoanAmount),
        requestedAmount,
        requestedAmountEligible,
        estimatedMonthlyInstallment: Math.round(requestedInstallment),
        totalRepayable: Math.round(requestedInstallment * requestedTermMonths),
        processingFee: Math.round(requestedAmount * (criteria.processingFeePercent / 100)),
        interestRate: criteria.interestRate,
        minTerm: criteria.minRepaymentMonths,
        maxTerm: criteria.maxRepaymentMonths,
        processingFeePercent: criteria.processingFeePercent,
        requiresGuarantor: criteria.requiresGuarantor,
        requiresPayslip: criteria.requiresPayslip,
        notes: criteria.notes || '',
        dtiIfApproved: parseFloat(dtiIfApproved.toFixed(1)),
    };
}
function rankInstitutions(institutions) {
    const results = institutions.map(inst => checkInstitution(inst));
    const eligible = results
        .filter(r => r.eligible)
        .sort((a, b) => b.maxLoanAmount - a.maxLoanAmount)
        .slice(0, 5)
        .map((r, i) => ({ ...r, rank: i + 1 }));
    const ineligible = results.filter(r => !r.eligible);
    const first = institutions[0];
    const maxDti = first?.criteria?.maxDtiRatio ?? 0.4;
    const salary = first?.monthlyNetSalary ?? 0;
    const existing = first?.existingMonthlyRepayments ?? 0;
    return {
        ranked: eligible,
        ineligible,
        profileSummary: {
            salary,
            existingRepayments: existing,
            availableRepaymentCapacity: Math.max(0, salary * maxDti - existing),
            employmentCategory: first?.employmentCategory ?? '',
        },
    };
}
function buildResult(p, eligible, reason, maxLoanAmount = 0) {
    const installment = calculateMonthlyInstallment(p.requestedAmount, p.criteria.interestRate, p.requestedTermMonths);
    return {
        institutionId: p.institutionId,
        institutionName: p.institutionName,
        institutionType: p.institutionType,
        eligible,
        ineligibilityReason: reason,
        maxLoanAmount,
        requestedAmount: p.requestedAmount,
        requestedAmountEligible: false,
        estimatedMonthlyInstallment: Math.round(installment),
        totalRepayable: Math.round(installment * p.requestedTermMonths),
        processingFee: Math.round(p.requestedAmount * (p.criteria.processingFeePercent / 100)),
        interestRate: p.criteria.interestRate,
        minTerm: p.criteria.minRepaymentMonths,
        maxTerm: p.criteria.maxRepaymentMonths,
        processingFeePercent: p.criteria.processingFeePercent,
        requiresGuarantor: p.criteria.requiresGuarantor,
        requiresPayslip: p.criteria.requiresPayslip,
        notes: p.criteria.notes || '',
        dtiIfApproved: 0,
    };
}
function formatCategory(cat) {
    const map = {
        civil_servant: 'Civil Servant',
        private_sector: 'Private Sector',
        self_employed: 'Self-Employed',
        sacco_member: 'SACCO Member',
    };
    return map[cat] ?? cat;
}
//# sourceMappingURL=eligibilityEngine.js.map