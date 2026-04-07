import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const loanId = parseInt(id);

  try {
    const loan = await (prisma as any).loan.findUnique({
      where: { id: loanId, userId: session.userId },
    });

    if (!loan || !loan.isActive) {
      return NextResponse.json({ error: "Loan not found or already completed." }, { status: 404 });
    }

    if (loan.paidMonths >= loan.loanTermMonths) {
      return NextResponse.json({ error: "Loan already fully repaid." }, { status: 400 });
    }

    const isLastPayment = (loan.paidMonths + 1) >= loan.loanTermMonths;
    
    await (prisma as any).loan.update({
      where: { id: loanId },
      data: {
        paidMonths: { increment: 1 },
        remainingBalance: isLastPayment ? 0 : { decrement: loan.monthlyDeduction },
        isActive: !isLastPayment,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
