"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMonthlyInstallment = calculateMonthlyInstallment;
exports.calculateDtiRatio = calculateDtiRatio;
function calculateMonthlyInstallment(amount, annualRate, months) {
    if (annualRate === 0)
        return amount / months;
    const monthlyRate = annualRate / 100 / 12;
    const denominator = Math.pow(1 + monthlyRate, months) - 1;
    if (denominator === 0)
        return amount / months;
    const installment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / denominator;
    return installment;
}
function calculateDtiRatio(monthlySalary, existingLoanRepayments, newLoanInstallment) {
    if (monthlySalary === 0)
        return 0;
    return ((existingLoanRepayments + newLoanInstallment) / monthlySalary) * 100;
}
//# sourceMappingURL=eligibilityEngine.js.map