"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-warning", APPROVED: "badge-success", REJECTED: "badge-danger", ACTIVE: "badge-info",
};
const RISK_BADGE: Record<string, string> = {
  EXCELLENT: "badge-success", GOOD: "badge-info", FAIR: "badge-warning", POOR: "badge-danger", UNKNOWN: "badge-neutral",
};

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "";

  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = statusFilter ? `/api/admin/applications?status=${statusFilter}` : "/api/admin/applications";
    Promise.all([
      fetch(url).then(r => { if (r.status === 401 || r.status === 403) { router.push("/login"); return null; } return r.json(); }),
      fetch("/api/admin/stats").then(r => r.json()),
    ]).then(([appData, statsData]) => {
      if (appData) setApplications(appData.applications || []);
      if (statsData) setStats(statsData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [statusFilter, router]);

  if (loading) return <div style={{ padding: 40, color: "var(--color-text-muted)" }}>Loading applications…</div>;

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

      <div className={styles.statsGrid}>
        <div className={`card ${styles.statCard}`}>
          <div className="stat-label">Total Applications</div>
          <div className="stat-value">{stats.total ?? 0}</div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className="stat-label">Pending Review</div>
          <div className="stat-value" style={{ color: "var(--color-warning)" }}>{stats.pending ?? 0}</div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className="stat-label">Approved</div>
          <div className="stat-value" style={{ color: "var(--color-success)" }}>{stats.approved ?? 0}</div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className="stat-label">Rejected</div>
          <div className="stat-value" style={{ color: "var(--color-danger)" }}>{stats.rejected ?? 0}</div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className="stat-label">Active Loans</div>
          <div className="stat-value" style={{ color: "var(--color-info)" }}>{stats.active ?? 0}</div>
        </div>
      </div>

      <div className={styles.tabs}>
        {[undefined, "PENDING", "APPROVED", "REJECTED", "ACTIVE"].map(s => (
          <Link
            key={s ?? "ALL"}
            href={s ? `/admin?status=${s}` : "/admin"}
            className={`${styles.tab} ${(!statusFilter && !s) || statusFilter === s ? styles.tabActive : ""}`}
          >
            {s ?? "All"}
          </Link>
        ))}
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Applicant</th><th>Bank</th><th>Amount</th><th>Purpose</th>
              <th>Risk Score</th><th>DTI</th><th>Date</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--color-text-muted)", padding: 40 }}>No applications found</td></tr>
            ) : applications.map((app: any) => (
              <tr key={app.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{app.user?.fullName}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>ID: {app.user?.employeeNumber}</div>
                </td>
                <td className="text-sm">{app.institution?.name || "N/A"}</td>
                <td>MK {app.amount?.toLocaleString()}</td>
                <td className="text-sm">{app.purpose}</td>
                <td>
                  <span className={`badge ${RISK_BADGE[app.riskCategory] ?? "badge-neutral"}`}>
                    {app.riskScore}/120
                  </span>
                </td>
                <td style={{ color: app.dtiRatio > 33 ? "var(--color-danger)" : "var(--color-success)" }}>
                  {Number(app.dtiRatio).toFixed(1)}%
                </td>
                <td className="text-sm">{new Date(app.createdAt).toLocaleDateString()}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[app.status] ?? "badge-neutral"}`}>{app.status}</span>
                </td>
                <td>
                  <Link href={`/admin/applications/${app.id}`} className="btn btn-outline btn-sm">Review →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
