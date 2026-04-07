import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const institutions = await (prisma as any).institution.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ institutions });
  } catch (error) {
    console.error("Failed to fetch institutions:", error);
    return NextResponse.json({ error: "Failed to fetch institutions" }, { status: 500 });
  }
}
