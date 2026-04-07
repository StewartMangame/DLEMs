import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const appId = parseInt(id);
  if (isNaN(appId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const { action, officerNotes } = await req.json();
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const application = await prisma.loanApplication.findUnique({ where: { id: appId } });
    if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    if (application.status !== "PENDING") {
      return NextResponse.json({ error: "Application has already been reviewed." }, { status: 409 });
    }

    if (action === "approve") {
      const startDate = new Date();
      const nextDue = new Date();
      nextDue.setMonth(nextDue.getMonth() + 1);
      
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + application.durationMonths);

      await prisma.$transaction([
        prisma.loanApplication.update({
          where: { id: appId },
          data: { status: "APPROVED", officerNotes, reviewedAt: new Date() },
        }),
        prisma.activeLoan.create({
          data: {
            userId: application.userId,
            applicationId: appId,
            principal: application.amount,
            interestRate: application.interestRate,
            monthlyInstallment: application.monthlyInstallment,
            totalRepayable: application.totalRepayable,
            remainingBalance: application.totalRepayable,
            nextDueDate: nextDue,
            totalMonths: application.durationMonths,
            startDate,
            endDate,
            status: "ACTIVE",
          },
        }),
      ]);
    } else {
      await prisma.loanApplication.update({
        where: { id: appId },
        data: { status: "REJECTED", officerNotes, reviewedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
