import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { fullName, nationalId, employeeNumber, phone, email, bank, password } = await req.json();

    if (!fullName || !nationalId || !employeeNumber || !phone || !email || !bank || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { nationalId }, { employeeNumber }] },
    });
    if (existing) {
      return NextResponse.json({ error: "An account with this email, National ID, or Employee Number already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await (prisma as any).user.create({
      data: { fullName, nationalId, employeeNumber, phone, email, bank, passwordHash },
    });

    const session = await getSession();
    session.userId = user.id;
    session.role = user.role;
    session.fullName = user.fullName;
    session.bank = user.bank;
    await session.save();

    return NextResponse.json({ success: true, role: user.role });
  } catch (err) {
    const error = err as Error;
    console.error("Registration error:", error.message, error.stack);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
