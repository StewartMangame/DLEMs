/*
  Warnings:

  - Added the required column `remainingBalance` to the `ActiveLoan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeNumber` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActiveLoan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "principal" REAL NOT NULL,
    "interestRate" REAL NOT NULL,
    "monthlyInstallment" REAL NOT NULL,
    "totalRepayable" REAL NOT NULL,
    "remainingBalance" REAL NOT NULL,
    "paidMonths" INTEGER NOT NULL DEFAULT 0,
    "totalMonths" INTEGER NOT NULL,
    "nextDueDate" DATETIME,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "ActiveLoan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActiveLoan_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "LoanApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ActiveLoan" ("applicationId", "endDate", "id", "interestRate", "monthlyInstallment", "paidMonths", "principal", "startDate", "status", "totalMonths", "totalRepayable", "userId") SELECT "applicationId", "endDate", "id", "interestRate", "monthlyInstallment", "paidMonths", "principal", "startDate", "status", "totalMonths", "totalRepayable", "userId" FROM "ActiveLoan";
DROP TABLE "ActiveLoan";
ALTER TABLE "new_ActiveLoan" RENAME TO "ActiveLoan";
CREATE UNIQUE INDEX "ActiveLoan_applicationId_key" ON "ActiveLoan"("applicationId");
CREATE TABLE "new_FinancialProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "employer" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "monthlySalary" REAL NOT NULL,
    "employmentYears" REAL NOT NULL,
    "age" INTEGER NOT NULL,
    "housingStatus" TEXT NOT NULL,
    "existingLoanAmount" REAL NOT NULL DEFAULT 0,
    "totalBorrowedAmount" REAL NOT NULL DEFAULT 0,
    "bankingYears" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FinancialProfile" ("age", "bankingYears", "employer", "employmentType", "employmentYears", "existingLoanAmount", "housingStatus", "id", "monthlySalary", "updatedAt", "userId") SELECT "age", "bankingYears", "employer", "employmentType", "employmentYears", "existingLoanAmount", "housingStatus", "id", "monthlySalary", "updatedAt", "userId" FROM "FinancialProfile";
DROP TABLE "FinancialProfile";
ALTER TABLE "new_FinancialProfile" RENAME TO "FinancialProfile";
CREATE UNIQUE INDEX "FinancialProfile_userId_key" ON "FinancialProfile"("userId");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "bank" TEXT NOT NULL,
    "department" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("bank", "createdAt", "email", "fullName", "id", "nationalId", "passwordHash", "phone", "role") SELECT "bank", "createdAt", "email", "fullName", "id", "nationalId", "passwordHash", "phone", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_nationalId_key" ON "User"("nationalId");
CREATE UNIQUE INDEX "User_employeeNumber_key" ON "User"("employeeNumber");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
