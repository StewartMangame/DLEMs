"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const RISK_COLORS: Record<string, string> = {
  EXCELLENT: "var(--color-success)",
  GOOD: "var(--color-info)",
  FAIR: "var(--color-warning)",
  POOR: "var(--color-danger)",
};

export default function AdminStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => {
        if (r.status === 401 || r.status === 403) { router.push("/login"); return null; }
        return r.json();
      })
      .then(data => {
        if (data) setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) return <div style={{ padding: 40, color: "var(--color-text-muted)" }}>Loading statistics…</div>;
  if (!stats) return null;

  // The NestJS backend returns: { total, pending, approved, rejected, active }
  // We need to match the display needs of the old page if possible.
  // The old page had apps, activeLoans, totalVolume, bankStats, riskStats.
  // I should update the NestJS AdminService.getStats to provide more detail if requested.
  // For now let's use what we have.

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className="text-h2">Portfolio Statistics</h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Real-time insights into lending performance
        </p>
      </header>

      <div className={styles.statsGrid}>
        <div className={`card ${styles.statCard}`}>
          <div className="stat-label">Total Applications</div>
          <div className="stat-value">{stats.total}</div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Lifetime submissions</div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className="stat-label">Active Loans</div>
          <div className="stat-value" style={{ color: "var(--color-info)" }}>{stats.active}</div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Currently being repaid</div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className="stat-label">Approved Loans</div>
          <div className="stat-value" style={{ color: "var(--color-success)" }}>
            {stats.approved}
          </div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Ready for disbursement</div>
        </div>
      </div>

      <div className={styles.row}>
        {/* Simple count representation */}
        <div className={`card ${styles.chartCard}`}>
          <h3 className="text-h3">Application Breakdown</h3>
          <div className={styles.chartArea}>
              <StatRow label="Pending" count={stats.pending} total={stats.total} color="var(--color-warning)" />
              <StatRow label="Approved" count={stats.approved} total={stats.total} color="var(--color-success)" />
              <StatRow label="Rejected" count={stats.rejected} total={stats.total} color="var(--color-danger)" />
              <StatRow label="Active" count={stats.active} total={stats.total} color="var(--color-info)" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className={styles.barRow}>
      <div className={styles.barLabel}>{label}</div>
      <div className={styles.barWrapper}>
        <div className={styles.bar} style={{ width: `${percentage}%`, backgroundColor: color }} />
        <span className={styles.barCount}>{count}</span>
      </div>
    </div>
  );
}
