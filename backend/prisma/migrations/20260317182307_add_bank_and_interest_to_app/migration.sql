-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LoanApplication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "bank" TEXT NOT NULL DEFAULT 'FDH Bank',
    "purpose" TEXT NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "monthlyInstallment" REAL NOT NULL,
    "interestRate" REAL NOT NULL DEFAULT 24,
    "totalRepayable" REAL NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskCategory" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "dtiRatio" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "officerNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    CONSTRAINT "LoanApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LoanApplication" ("amount", "createdAt", "dtiRatio", "durationMonths", "id", "monthlyInstallment", "officerNotes", "purpose", "reviewedAt", "riskCategory", "riskScore", "status", "totalRepayable", "userId") SELECT "amount", "createdAt", "dtiRatio", "durationMonths", "id", "monthlyInstallment", "officerNotes", "purpose", "reviewedAt", "riskCategory", "riskScore", "status", "totalRepayable", "userId" FROM "LoanApplication";
DROP TABLE "LoanApplication";
ALTER TABLE "new_LoanApplication" RENAME TO "LoanApplication";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
