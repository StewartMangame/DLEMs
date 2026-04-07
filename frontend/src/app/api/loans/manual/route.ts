import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { institutionId, loanAmount, monthlyDeduction, loanTermMonths, startDate } = await req.json();

    // Basic calculation for remaining balance logic
    // Months elapsed = (Now - StartDate)
    const start = new Date(startDate);
    const now = new Date();
    const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const amountRepaid = Math.min(loanAmount, Math.max(0, monthsElapsed) * monthlyDeduction);
    const remainingBalance = Math.max(0, loanAmount - amountRepaid);

    const loan = await prisma.loan.create({
      data: {
        userId: session.userId,
        providerInstitutionId: institutionId,
        loanAmount: loanAmount,
        monthlyDeduction: monthlyDeduction,
        loanTermMonths: loanTermMonths,
        startDate: start,
        remainingBalance: remainingBalance,
        paidMonths: Math.max(0, monthsElapsed),
        isActive: true,
      }
    });

    return NextResponse.json({ loan });
  } catch (error) {
    console.error("Failed to record manual loan:", error);
    return NextResponse.json({ error: "Failed to create loan record" }, { status: 500 });
  }
}
