import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { assessEligibility, simulateAllInstitutions } from "@/lib/eligibilityEngine";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const loanAmount = Number(body.loanAmount);
    const durationMonths = Number(body.durationMonths);
    const institutionId = Number(body.institutionId);

    // Fetch User Profile
    const user = (await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        profile: true,
        activeLoans: { where: { isActive: true } } as any,
      },
    })) as any;

    if (!user || !user.profile) {
      return NextResponse.json({ error: "Financial profile not found" }, { status: 400 });
    }

    const totalExistingDeduction = user.activeLoans.reduce((sum: number, loan: any) => sum + loan.monthlyDeduction, 0) + (user.profile.existingLoanAmount || 0);

    const input = {
      monthlySalary: user.profile.monthlyNetSalary || 0,
      employmentType: user.profile.employmentType,
      existingLoanAmount: totalExistingDeduction,
      loanAmount,
      durationMonths,
      institutionId,
    };

    // Fetch Criteria for all institutions
    const allCriteria: any[] = await (prisma as any).institutionCriteria.findMany({
      include: { institution: true },
    });

    if (allCriteria.length === 0) {
      return NextResponse.json({ error: "No lender criteria populated" }, { status: 500 });
    }

    // Determine target criteria
    const targetCriteria = allCriteria.find((c: any) => c.institutionId === institutionId) || allCriteria[0];

    const result = assessEligibility(input, targetCriteria as any);
    const bankSimulations = simulateAllInstitutions(input, allCriteria as any);

    return NextResponse.json({ result, bankSimulations });
  } catch (err) {
    console.error("Eligibility Calculation Error:", err);
    return NextResponse.json({ error: "Engine error during evaluation." }, { status: 500 });
  }
}
