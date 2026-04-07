import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ReviewForm from "./ReviewForm";
import styles from "./page.module.css";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session.userId || session.role !== "admin") redirect("/login");

  const { id } = await params;
  const appId = parseInt(id);
  if (isNaN(appId)) notFound();

  const app = (await (prisma as any).loanApplication.findUnique({
    where: { id: appId },
    include: { 
      user: { include: { profile: { include: { salaryInstitution: true } } } },
      institution: true 
    },
  })) as any;

  if (!app) notFound();

  const profile = app.user.profile as any;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/admin" className="btn btn-ghost btn-sm">← Back to Queue</Link>
        <div>
          <h1 className="text-h2">Application #{app.id}</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Submitted {new Date(app.createdAt).toLocaleDateString("en-GB", { dateStyle: "long" })}
          </p>
        </div>
        <span className={`badge ${STATUS_BADGE[app.status]}`} style={{ fontSize: "0.9rem", padding: "8px 16px" }}>
          {app.status}
        </span>
      </div>

      <div className={styles.grid}>
        {/* Left Column */}
        <div className={styles.leftCol}>
          {/* Applicant Info */}
          <div className={`card ${styles.section}`}>
            <h2 className={styles.sectionTitle}>Applicant</h2>
            <div className={styles.infoGrid}>
              <Row label="Full Name" value={app.user.fullName} />
              <Row label="Employee No." value={app.user.employeeNumber} />
              <Row label="National ID" value={app.user.nationalId} />
              <Row label="Email" value={app.user.email} />
              <Row label="Phone" value={app.user.phone} />
              <Row label="Bank" value={app.user.bank} />
            </div>
          </div>

          {/* Financial Profile */}
          {profile && (
            <div className={`card ${styles.section}`}>
              <h2 className={styles.sectionTitle}>Financial Profile</h2>
              <div className={styles.infoGrid}>
                <Row label="Employer" value={profile.employerName} />
                <Row label="Employment Type" value={profile.employmentType.replace(/_/g, " ").toUpperCase()} />
                <Row label="Monthly Net Salary" value={`MK ${profile.monthlyNetSalary.toLocaleString()}`} highlight="success" />
                <Row label="Employment Years" value={`${profile.employmentYears || 0} years`} />
                <Row label="Age" value={`${profile.age || 0} years`} />
                <Row label="Housing" value={profile.housingStatus || "N/A"} />
                <Row label="Existing Monthly Debt" value={`MK ${profile.existingLoanAmount.toLocaleString()}`} highlight="warning" />
                <Row label="Banking History" value={`${profile.bankingYears || 0} years`} />
                <Row label="Salary Bank" value={profile.salaryInstitution?.name || "N/A"} />
              </div>
            </div>
          )}

          {/* Loan Details */}
          <div className={`card ${styles.section}`}>
            <h2 className={styles.sectionTitle}>Loan Request</h2>
            <div className={styles.infoGrid}>
              <Row label="Loan Amount" value={`MK ${app.amount.toLocaleString()}`} highlight="primary" />
              <Row label="Purpose" value={app.purpose} />
              <Row label="Duration" value={`${app.durationMonths} months`} />
              <Row label="Monthly Installment" value={`MK ${app.monthlyInstallment.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
              <Row label="Total Repayable" value={`MK ${app.totalRepayable.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            </div>
          </div>
        </div>

        {/* Right Column — Risk & Decision */}
        <div className={styles.rightCol}>
          {/* Risk Assessment */}
          <div className={`card ${styles.section}`}>
            <h2 className={styles.sectionTitle}>Risk Assessment</h2>
            <div className={styles.riskScore}>
              <div className={styles.riskNum} style={{ color: SCORE_COLOR(app.riskScore) }}>
                {app.riskScore}<span style={{ fontSize: "1rem", color: "var(--color-text-muted)" }}>/120</span>
              </div>
              <span className={`badge ${RISK_BADGE[app.riskCategory]}`}>{app.riskCategory}</span>
            </div>
            <div className="progress-bar" style={{ marginTop: 16 }}>
              <div className={`progress-fill`}
                style={{ width: `${(app.riskScore / 120) * 100}%`, background: SCORE_COLOR(app.riskScore) }} />
            </div>
            <div className={styles.riskRow}>
              <span>DTI Ratio</span>
              <strong style={{ color: app.dtiRatio > 40 ? "var(--color-danger)" : "var(--color-success)" }}>
                {app.dtiRatio.toFixed(1)}% {app.dtiRatio > 40 ? "⚠ OVER LIMIT" : "✓ OK"}
              </strong>
            </div>

          </div>

          {/* Officer Notes (if reviewed) */}
          {app.officerNotes && (
            <div className={`card ${styles.section}`}>
              <h2 className={styles.sectionTitle}>Officer Notes</h2>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{app.officerNotes}</p>
              {app.reviewedAt && (
                <p className="text-xs" style={{ color: "var(--color-text-muted)", marginTop: 8 }}>
                  Reviewed: {new Date(app.reviewedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Review Form */}
          <ReviewForm applicationId={app.id} currentStatus={app.status} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: "success" | "warning" | "primary" }) {
  const colors = { success: "var(--color-success)", warning: "var(--color-warning)", primary: "var(--color-primary)" };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" }}>
      <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <strong style={{ color: highlight ? colors[highlight] : "var(--color-text-primary)" }}>{value}</strong>
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-warning", APPROVED: "badge-success",
  REJECTED: "badge-danger", ACTIVE: "badge-info",
};
const RISK_BADGE: Record<string, string> = {
  EXCELLENT: "badge-success", GOOD: "badge-info", FAIR: "badge-warning", POOR: "badge-danger", UNKNOWN: "badge-neutral",
};
const SCORE_COLOR = (s: number) => s >= 100 ? "var(--color-success)" : s >= 80 ? "var(--color-info)" : s >= 60 ? "var(--color-warning)" : "var(--color-danger)";
