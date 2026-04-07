import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const user = await (prisma as any).user.findUnique({
    where: { id: session.userId },
    include: { profile: { include: { salaryInstitution: true } } }
  });
  
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ 
    profile: user.profile,
    bank: user.bank 
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { 
      bank, employer, employmentType, monthlySalary, employmentYears, 
      age, housingStatus, existingLoanAmount, bankingYears, salaryInstitutionId
    } = await req.json();

    const profile = await (prisma as any).financialProfile.upsert({
      where: { userId: session.userId },
      update: { 
        employerName: employer, 
        employmentType, 
        monthlyNetSalary: monthlySalary, 
        employmentYears, 
        age, 
        housingStatus, 
        existingLoanAmount: existingLoanAmount || 0, 
        bankingYears: bankingYears || 0,
        salaryInstitutionId: salaryInstitutionId ? parseInt(salaryInstitutionId) : null
      },
      create: { 
        userId: session.userId, 
        employerName: employer, 
        employmentType, 
        monthlyNetSalary: monthlySalary, 
        employmentYears, 
        age, 
        housingStatus, 
        existingLoanAmount: existingLoanAmount || 0, 
        bankingYears: bankingYears || 0,
        salaryInstitutionId: salaryInstitutionId ? parseInt(salaryInstitutionId) : null
      },
    });

    return NextResponse.json({ profile, bank });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
