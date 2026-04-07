import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { assessEligibility } from "@/lib/eligibilityEngine";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { amount, purpose, durationMonths, institutionId } = await req.json();
    if (!amount || !purpose || !durationMonths || !institutionId) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const user = await (prisma as any).user.findUnique({ 
        where: { id: session.userId },
        include: { 
            profile: true,
            activeLoans: { where: { isActive: true } }
        }
    });

    if (!user || !user.profile) {
      return NextResponse.json({ error: "Please complete your financial profile first." }, { status: 400 });
    }

    const criteria = await (prisma as any).institutionCriteria.findUnique({
        where: { institutionId: parseInt(institutionId) },
        include: { institution: true }
    });

    if (!criteria) {
        return NextResponse.json({ error: "Selected institution not found or has no active criteria." }, { status: 404 });
    }

    const totalExistingDeduction = user.activeLoans.reduce((sum: number, loan: any) => sum + loan.monthlyDeduction, 0) + (user.profile.existingLoanAmount || 0);

    const result = assessEligibility({
      monthlySalary: user.profile.monthlyNetSalary,
      employmentType: user.profile.employmentType,
      existingLoanAmount: totalExistingDeduction,
      loanAmount: parseFloat(amount),
      durationMonths: parseInt(durationMonths),
      institutionId: parseInt(institutionId),
    }, criteria);

    const application = await (prisma as any).loanApplication.create({
      data: {
        userId: session.userId,
        institutionId: parseInt(institutionId),
        amount: parseFloat(amount),
        purpose,
        durationMonths: parseInt(durationMonths),
        monthlyInstallment: result.monthlyInstallment,
        riskScore: result.riskScore,
        riskCategory: result.riskCategory,
        dtiRatio: result.dtiRatio,
        status: "PENDING",
      },
    });

    return NextResponse.json({ application, eligible: result.eligible });
  } catch (err) {
    console.error("Loan Application Error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
