import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "Dashboard | DLEM Malawi",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const rawUser: any = await (prisma as any).user.findUnique({
    where: { id: session.userId },
    include: {
      profile: {
        include: { salaryInstitution: true }
      },
      applications: { 
        orderBy: { createdAt: "desc" }, 
        take: 5,
        include: { institution: true }
      },
      activeLoans: { 
        where: { isActive: true }, 
        take: 3,
        include: { providerInstitution: true }
      },
    },
  });

  const user = rawUser;

  if (!user) redirect("/login");

  const profile = user.profile;
  const totalActiveDebt = user.activeLoans.reduce((acc: number, loan: any) => acc + (loan.remainingBalance || 0), 0);
  const totalMonthlyDebt = (profile?.existingLoanAmount || 0) + user.activeLoans.reduce((s: number, l: any) => s + l.monthlyDeduction, 0);
  const dtiRatio = profile ? (totalMonthlyDebt / profile.monthlyNetSalary) * 100 : 0;
  const creditUtilization = profile ? ((profile.totalBorrowedAmount || 0) / (profile.monthlyNetSalary * 12 * 4)) * 100 : 0;

  // Smart Insights logic - Following Doc Thresholds
  const insights: { type: "danger" | "warning" | "success"; text: string }[] = [];
  if (dtiRatio > 33) {
    insights.push({ type: "danger", text: "High Risk: DTI exceeds 33%. You may face rejection for new loans." });
  } else if (dtiRatio >= 20) {
    insights.push({ type: "warning", text: "Moderate Risk: DTI between 20-33%. Manageable but monitor closely." });
  } else {
    insights.push({ type: "success", text: "Low Risk: DTI under 20%. You have healthy borrowing capacity." });
  }

  if (profile && (profile.monthlyNetSalary * 0.33) > totalMonthlyDebt) {
    insights.push({ type: "success", text: "You have available capacity for additional borrowing." });
  }


  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className="text-h2">
            Welcome, <span className="text-gradient">{user.fullName.split(" ")[0]}</span>
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Emp. ID: {user.employeeNumber} · {profile?.salaryInstitution?.name || "No Bank"} · {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* ── Profile Prompt ── */}
      {!profile && (
        <div className={`alert alert-info ${styles.profileAlert}`}>
          <span>ℹ</span>
          <div>
            <strong>Complete your financial profile</strong> to unlock loan eligibility checks and applications.{" "}
            <Link href="/dashboard/profile">Set up profile →</Link>
          </div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className={`grid-4 ${styles.kpiGrid}`}>
        <div className={`card ${styles.kpiCard}`}>
          <div className="stat-label">Monthly Salary</div>
          <div className="stat-value" style={{ color: "var(--color-success)" }}>
            {profile ? `MK ${profile.monthlyNetSalary.toLocaleString()}` : "—"}
          </div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Gross income</div>
        </div>
        <div className={`card ${styles.kpiCard}`}>
          <div className="stat-label">DTI Ratio</div>
          <div className="stat-value" style={{ color: dtiRatio > 33 ? "var(--color-danger)" : dtiRatio >= 20 ? "var(--color-warning)" : "var(--color-success)" }}>
            {profile ? `${dtiRatio.toFixed(1)}%` : "—"}
          </div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Threshold: 33%</div>
        </div>
        <div className={`card ${styles.kpiCard}`}>
          <div className="stat-label">Active Principal</div>
          <div className="stat-value" style={{ color: "var(--color-warning)" }}>
            MK {totalActiveDebt.toLocaleString()}
          </div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Through DLEM</div>
        </div>
        <div className={`card ${styles.kpiCard}`}>
          <div className="stat-label">Risk Level</div>
          <div className="stat-value" style={{ color: dtiRatio > 33 ? "var(--color-danger)" : dtiRatio >= 20 ? "var(--color-warning)" : "var(--color-success)" }}>
            {dtiRatio > 33 ? "High" : dtiRatio >= 20 ? "Moderate" : "Low"}
          </div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Risk Category</div>
        </div>
      </div>

      {/* ── Health Analysis ── */}
      {profile && (
        <div className={`grid-2 ${styles.healthRow}`}>
          <div className={`card ${styles.healthCard}`}>
            <h3 className="text-h3">Debt-to-Income Analysis</h3>
            <div className="progress-bar" style={{ height: 12, marginTop: 16 }}>
              <div
                className={`progress-fill ${dtiRatio > 33 ? "danger" : dtiRatio >= 20 ? "warning" : ""}`}
                style={{ width: `${Math.min(dtiRatio, 100)}%` }}
              />
            </div>
            <div className={styles.dtiScale}>
              <span>0%</span><span>Low</span><span>20%</span><span>Mod</span><span>33%</span><span>High</span>
            </div>

            <h3 className="text-h3" style={{ marginTop: 24 }}>Credit Utilization</h3>
            <div className="progress-bar" style={{ height: 12, marginTop: 16 }}>
              <div
                className={`progress-fill ${creditUtilization > 70 ? "danger" : creditUtilization > 40 ? "warning" : ""}`}
                style={{ width: `${Math.min(creditUtilization, 100)}%` }}
              />
            </div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)", marginTop: 8 }}>
              Utilizing {creditUtilization.toFixed(1)}% of estimated borrowing capacity
            </p>
          </div>

          <div className={`card ${styles.healthCard}`}>
            <h3 className="text-h3">Smart Insights</h3>
            <ul className={styles.insightList}>
              {insights.map((insight, idx) => (
                <li key={idx} className={`${styles.insightItem} ${styles[insight.type]}`}>
                  <span className={styles.insightDot} />
                  {insight.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className={styles.actionsSection}>
        <h2 className="text-h3">Quick Actions</h2>
        <div className={styles.actions}>
          {ACTIONS.map((a, i) => (
            <Link key={i} href={a.href} className={`card card-hover ${styles.actionCard}`}>
              <div className={styles.actionIcon} style={{ background: a.color }}>{a.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{a.title}</div>
                <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Applications ── */}
      {user.applications.length > 0 && (
        <div className={styles.appsSection}>
          <div className={styles.appsHeader}>
            <h2 className="text-h3">Recent Applications</h2>
            <Link href="/dashboard/loans" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Duration</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {user.applications.map((app: any) => (
                  <tr key={app.id}>
                    <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td>MK {app.amount.toLocaleString()}</td>
                    <td>{app.durationMonths} months</td>
                    <td>
                      <span className={`badge ${RISK_BADGE[app.riskCategory] ?? "badge-neutral"}`}>
                        {app.riskScore}/120 · {app.riskCategory}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[app.status] ?? "badge-neutral"}`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const ACTIONS = [
  { href: "/dashboard/eligibility", icon: "✦", title: "Check Eligibility", desc: "Run automated risk assessment", color: "rgba(30,111,255,0.15)" },
  { href: "/dashboard/apply", icon: "✚", title: "Apply for Loan", desc: "Submit a new loan application", color: "rgba(0,200,150,0.15)" },
  { href: "/dashboard/calculator", icon: "⊞", title: "Loan Calculator", desc: "Simulate repayments & schedule", color: "rgba(255,184,0,0.15)" },
  { href: "/dashboard/reminders", icon: "🔔", title: "Reminders", desc: "Deduction alerts & logs", color: "rgba(255,184,0,0.15)" },
  { href: "/dashboard/profile", icon: "◎", title: "My Profile", desc: "Update financial information", color: "rgba(0,180,216,0.15)" },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-warning", APPROVED: "badge-success",
  REJECTED: "badge-danger", ACTIVE: "badge-info",
};

const RISK_BADGE: Record<string, string> = {
  EXCELLENT: "badge-success", GOOD: "badge-info",
  FAIR: "badge-warning", POOR: "badge-danger", UNKNOWN: "badge-neutral",
};
