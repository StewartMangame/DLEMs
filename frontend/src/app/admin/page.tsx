import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata = { title: "Admin Dashboard | DLEM Malawi" };

interface AdminApplication {
  id: number;
  createdAt: Date;
  amount: number;
  purpose: string;
  riskScore: number;
  riskCategory: string;
  dtiRatio: number;
  status: string;
  user: {
    fullName: string;
    employeeNumber: string;
    bank: string;
  };
}

interface StatusCount {
  status: string;
  _count: {
    status: number;
  };
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session.userId || session.role !== "admin") redirect("/login");

  const { status } = await searchParams;
  const filter = status && ["PENDING", "APPROVED", "REJECTED", "ACTIVE"].includes(status)
    ? status
    : undefined;

  const applications = (await (prisma as any).loanApplication.findMany({
    where: filter ? { status: filter } : {},
    include: { 
      user: { include: { profile: true } },
      institution: true 
    },
    orderBy: { createdAt: "desc" },
  })) as any[];

  const counts = (await (prisma as any).loanApplication.groupBy({
    by: ["status"],
    _count: { status: true },
  })) as any[];

  const countMap: Record<string, number> = {};
  counts.forEach((c) => { countMap[c.status] = c._count.status; });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className="text-h2">Application Queue</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Review and process loan applications
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={`card ${styles.statCard}`}>
          <div className="stat-label">Total Applications</div>
          <div className="stat-value">{Object.values(countMap).reduce((a, b) => a + b, 0)}</div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className="stat-label">Pending Review</div>
          <div className="stat-value" style={{ color: "var(--color-warning)" }}>{countMap["PENDING"] ?? 0}</div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className="stat-label">Approved</div>
          <div className="stat-value" style={{ color: "var(--color-success)" }}>{countMap["APPROVED"] ?? 0}</div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className="stat-label">Rejected</div>
          <div className="stat-value" style={{ color: "var(--color-danger)" }}>{countMap["REJECTED"] ?? 0}</div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className="stat-label">Money In Play</div>
          <div className="stat-value" style={{ color: "var(--color-info)" }}>{(countMap["ACTIVE"] ?? 0) + (countMap["APPROVED"] ?? 0)}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.tabs}>
        {[undefined, "PENDING", "APPROVED", "REJECTED", "ACTIVE"].map(s => (
          <Link
            key={s ?? "ALL"}
            href={s ? `/admin?status=${s}` : "/admin"}
            className={`${styles.tab} ${(!filter && !s) || filter === s ? styles.tabActive : ""}`}
          >
            {s ?? "All"} {s && countMap[s] ? `(${countMap[s]})` : ""}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Bank</th>
              <th>Amount</th>
              <th>Purpose</th>
              <th>Risk Score</th>
              <th>DTI</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--color-text-muted)", padding: 40 }}>No applications found</td></tr>
            ) : applications.map((app) => (
              <tr key={app.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{app.user.fullName}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>ID: {app.user.employeeNumber}</div>
                </td>
                <td className="text-sm">{app.institution?.name || "N/A"}</td>
                <td>MK {app.amount.toLocaleString()}</td>
                <td className="text-sm">{app.purpose}</td>
                <td>
                  <span className={`badge ${RISK_BADGE[app.riskCategory] ?? "badge-neutral"}`}>
                    {app.riskScore}/120
                  </span>
                </td>
                <td style={{ color: app.dtiRatio > 33 ? "var(--color-danger)" : "var(--color-success)" }}>
                  {app.dtiRatio.toFixed(1)}%
                </td>
                <td className="text-sm">{new Date(app.createdAt).toLocaleDateString()}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[app.status] ?? "badge-neutral"}`}>{app.status}</span>
                </td>
                <td>
                  <Link href={`/admin/applications/${app.id}`} className="btn btn-outline btn-sm">
                    Review →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

