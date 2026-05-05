"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMonthlyInstallment = calculateMonthlyInstallment;
exports.calculateMaxPrincipal = calculateMaxPrincipal;
exports.getMultiplier = getMultiplier;
exports.calculateDtiRatio = calculateDtiRatio;
exports.checkInstitution = checkInstitution;
exports.rankInstitutions = rankInstitutions;
function calculateMonthlyInstallment(amount, annualRate, months) {
    if (months <= 0)
        return 0;
    if (annualRate === 0)
        return amount / months;
    const monthlyRate = annualRate / 100 / 12;
    const factor = Math.pow(1 + monthlyRate, months);
    return (amount * monthlyRate * factor) / (factor - 1);
}
function calculateMaxPrincipal(maxMonthlyPayment, annualRate, months) {
    if (months <= 0 || maxMonthlyPayment <= 0)
        return 0;
    if (annualRate === 0)
        return maxMonthlyPayment * months;
    const monthlyRate = annualRate / 100 / 12;
    const factor = Math.pow(1 + monthlyRate, months);
    return (maxMonthlyPayment * (factor - 1)) / (monthlyRate * factor);
}
function getMultiplier(category, criteria) {
    switch (category) {
        case 'civil_servant':
            return criteria.civilServantMultiplier;
        case 'private_sector':
            return criteria.privateMultiplier;
        case 'self_employed':
            return criteria.selfEmployedMultiplier;
        case 'sacco_member':
            return criteria.saccoMemberMultiplier;
        default:
            return criteria.privateMultiplier;
    }
}
function calculateDtiRatio(monthlySalary, existingRepayments, newInstallment) {
    if (monthlySalary <= 0)
        return 0;
    return ((existingRepayments + newInstallment) / monthlySalary) * 100;
}
function checkInstitution(p) {
    const { criteria, monthlyNetSalary, existingMonthlyRepayments, employmentCategory, requestedAmount, requestedTermMonths, } = p;
    if (!criteria.eligibleEmploymentTypes.includes(employmentCategory)) {
        return buildResult(p, `${p.institutionName} does not lend to ${formatCategory(employmentCategory)} borrowers.`);
    }
    if (monthlyNetSalary < criteria.minNetSalary) {
        return buildResult(p, `Minimum net salary required is MK ${criteria.minNetSalary.toLocaleString()}. Yours is MK ${monthlyNetSalary.toLocaleString()}.`);
    }
    const maxAffordableRepayment = criteria.maxDtiRatio * monthlyNetSalary - existingMonthlyRepayments;
    if (maxAffordableRepayment <= 0) {
        return buildResult(p, "Existing loan repayments already exceed this institution's DTI limit.");
    }
    const clampedTerm = Math.min(Math.max(requestedTermMonths, criteria.minRepaymentMonths), criteria.maxRepaymentMonths);
    const maxByDti = calculateMaxPrincipal(maxAffordableRepayment, criteria.interestRate, clampedTerm);
    const maxByMultiplier = monthlyNetSalary * getMultiplier(employmentCategory, criteria);
    const maxLoanAmount = Math.max(0, Math.min(maxByDti, maxByMultiplier));
    if (requestedTermMonths < criteria.minRepaymentMonths ||
        requestedTermMonths > criteria.maxRepaymentMonths) {
        return buildResult(p, `Repayment period must be between ${criteria.minRepaymentMonths} and ${criteria.maxRepaymentMonths} months.`, maxLoanAmount);
    }
    const requestedInstallment = calculateMonthlyInstallment(requestedAmount, criteria.interestRate, requestedTermMonths);
    const dtiIfApproved = calculateDtiRatio(monthlyNetSalary, existingMonthlyRepayments, requestedInstallment);
    const requestedAmountEligible = requestedAmount <= maxLoanAmount &&
        dtiIfApproved <= criteria.maxDtiRatio * 100;
    const eligible = requestedAmountEligible;
    return {
        institutionId: p.institutionId,
        institutionName: p.institutionName,
        institutionType: p.institutionType,
        eligible,
        ineligibilityReason: eligible
            ? undefined
            : buildRequestedAmountReason(requestedAmount, maxLoanAmount, dtiIfApproved, criteria.maxDtiRatio),
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
    const results = institutions.map((inst) => checkInstitution(inst));
    const ranked = results
        .filter((result) => result.eligible && result.requestedAmountEligible)
        .sort((a, b) => {
        if (a.interestRate !== b.interestRate)
            return a.interestRate - b.interestRate;
        if (a.dtiIfApproved !== b.dtiIfApproved)
            return a.dtiIfApproved - b.dtiIfApproved;
        return b.maxLoanAmount - a.maxLoanAmount;
    })
        .slice(0, 5)
        .map((result, index) => ({ ...result, rank: index + 1 }));
    const ineligible = results.filter((result) => !result.eligible);
    const first = institutions[0];
    const maxDti = first?.criteria?.maxDtiRatio ?? 0.4;
    const salary = first?.monthlyNetSalary ?? 0;
    const existing = first?.existingMonthlyRepayments ?? 0;
    return {
        ranked,
        ineligible,
        profileSummary: {
            salary,
            existingRepayments: existing,
            availableRepaymentCapacity: Math.max(0, salary * maxDti - existing),
            employmentCategory: first?.employmentCategory ?? '',
        },
    };
}
function buildResult(p, reason, maxLoanAmount = 0) {
    const installment = calculateMonthlyInstallment(p.requestedAmount, p.criteria.interestRate, p.requestedTermMonths);
    return {
        institutionId: p.institutionId,
        institutionName: p.institutionName,
        institutionType: p.institutionType,
        eligible: false,
        ineligibilityReason: reason,
        maxLoanAmount: Math.round(maxLoanAmount),
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
function buildRequestedAmountReason(requestedAmount, maxLoanAmount, dtiIfApproved, maxDtiRatio) {
    const maxDtiPercent = maxDtiRatio * 100;
    if (requestedAmount > maxLoanAmount) {
        return `Requested amount is above this lender's estimated maximum of MK ${Math.round(maxLoanAmount).toLocaleString()}.`;
    }
    return `Estimated repayment would push DTI to ${dtiIfApproved.toFixed(1)}%, above this lender's ${maxDtiPercent.toFixed(0)}% limit.`;
}
function formatCategory(category) {
    const labels = {
        civil_servant: 'civil servant',
        private_sector: 'private sector',
        self_employed: 'self-employed',
        sacco_member: 'SACCO member',
    };
    return labels[category] ?? category;
}
//# sourceMappingURL=eligibilityEngine.js.map