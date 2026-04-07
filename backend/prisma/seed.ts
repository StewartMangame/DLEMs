import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

// For Prisma 7, we pass a config object with 'url' to the adapter factory
const dbPath = path.join(process.cwd(), "prisma", "v2.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting seed script...");

  // 1. Create Institutions
  const nbm = await prisma.institution.upsert({
    where: { name: "National Bank of Malawi" },
    update: {},
    create: {
      name: "National Bank of Malawi",
      type: "BANK",
      isActive: true,
      criteria: {
        create: {
          maxDtiRatio: 33.0,
          minNetSalary: 100000.0,
          maxLoanMultiplier: 6.0,
        }
      }
    },
  });

  const fdh = await prisma.institution.upsert({
    where: { name: "FDH Bank" },
    update: {},
    create: {
      name: "FDH Bank",
      type: "BANK",
      isActive: true,
      criteria: {
        create: {
          maxDtiRatio: 40.0,
          minNetSalary: 80000.0,
          maxLoanMultiplier: 5.0,
        }
      }
    },
  });

  const standard = await prisma.institution.upsert({
    where: { name: "Standard Bank Malawi" },
    update: {},
    create: {
      name: "Standard Bank Malawi",
      type: "BANK",
      isActive: true,
      criteria: {
        create: {
          maxDtiRatio: 33.0,
          minNetSalary: 150000.0,
          maxLoanMultiplier: 7.0,
        }
      }
    },
  });

  console.log("Institutions created.");

  // 2. Create Admin and Users
  const adminHash = await bcrypt.hash("admin1234", 12);
  await prisma.user.upsert({
    where: { email: "admin@dlem.mw" },
    update: {
       role: "admin",
       passwordHash: adminHash,
    },
    create: {
      fullName: "System Admin",
      nationalId: "ADMIN-001",
      employeeNumber: "OFF-2024-001",
      phone: "+265 999 000 000",
      email: "admin@dlem.mw",
      passwordHash: adminHash,
      role: "admin",
    },
  });

  const fdhAdminHash = await bcrypt.hash("fdh1234", 12);
  await prisma.user.upsert({
    where: { email: "admin@fdh.mw" },
    update: {},
    create: {
      fullName: "FDH Admin",
      nationalId: "ADMIN-FDH",
      employeeNumber: "FDH-OFF-001",
      phone: "+265 999 123 456",
      email: "admin@fdh.mw",
      passwordHash: fdhAdminHash,
      role: "customer",
      isInstitutionAdmin: true,
      institutionId: fdh.id,
    },
  });

  const customerHash = await bcrypt.hash("customer1234", 12);
  const customer = await prisma.user.upsert({
    where: { email: "john.banda@demo.mw" },
    update: {},
    create: {
      fullName: "John Banda",
      nationalId: "MW-2024-112233",
      employeeNumber: "CS-2024-001",
      phone: "+265 888 123 456",
      email: "john.banda@demo.mw",
      passwordHash: customerHash,
      role: "customer",
    },
  });

  // 3. Create Demo Profile
  await prisma.financialProfile.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
      employerName: "Ministry of Health",
      employmentType: "CIVIL",
      monthlyNetSalary: 450000,
      salaryInstitutionId: nbm.id,
      age: 38,
      housingStatus: "owner",
    },
  });

  // 4. Create Active Loans
  await prisma.loan.create({
    data: {
      userId: customer.id,
      providerInstitutionId: fdh.id,
      loanAmount: 1200000,
      monthlyDeduction: 45000,
      loanTermMonths: 36,
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 10)),
      remainingBalance: 800000,
      paidMonths: 10,
      isActive: true,
    }
  });

  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
