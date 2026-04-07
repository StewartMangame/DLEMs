import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

export const metadata = { title: "Admin Statistics | DLEM Malawi" };

export default async function AdminStatsPage() {
  const session = await getSession();
  if (!session.userId || session.role !== "admin") redirect("/login");

  // Fetch data for stats
  const [apps, activeLoans, totalVolume, bankStats] = await Promise.all([
    prisma.loanApplication.count(),
    prisma.activeLoan.count(),
    prisma.activeLoan.aggregate({ _sum: { principal: true } }),
    prisma.user.groupBy({
      by: ["bank"],
      where: { role: "customer" },
      _count: { _all: true },
    }),
  ]);

  const riskStats = await prisma.loanApplication.groupBy({
    by: ["riskCategory"],
    _count: { _all: true },
  });

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
          <div className="stat-value">{apps}</div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Lifetime submissions</div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className="stat-label">Active Loans</div>
          <div className="stat-value" style={{ color: "var(--color-info)" }}>{activeLoans}</div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Currently being repaid</div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className="stat-label">Active Portfolio Volume</div>
          <div className="stat-value" style={{ color: "var(--color-success)" }}>
            MK {(totalVolume._sum.principal || 0).toLocaleString()}
          </div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Total principal disbursed</div>
        </div>
      </div>

      <div className={styles.row}>
        {/* Risk Distribution */}
        <div className={`card ${styles.chartCard}`}>
          <h3 className="text-h3">Risk Distribution</h3>
          <div className={styles.chartArea}>
            {riskStats.map(stat => (
              <div key={stat.riskCategory} className={styles.barRow}>
                <div className={styles.barLabel}>{stat.riskCategory}</div>
                <div className={styles.barWrapper}>
                  <div 
                    className={styles.bar} 
                    style={{ 
                      width: `${(stat._count._all / apps) * 100}%`,
                      backgroundColor: RISK_COLORS[stat.riskCategory] || "var(--color-text-muted)"
                    }} 
                  />
                  <span className={styles.barCount}>{stat._count._all}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bank Partner Distribution */}
        <div className={`card ${styles.chartCard}`}>
          <h3 className="text-h3">Bank Partner Distribution</h3>
          <div className={styles.chartArea}>
            {bankStats.map(stat => (
              <div key={stat.bank || "None"} className={styles.barRow}>
                <div className={styles.barLabel}>{stat.bank || "N/A"}</div>
                <div className={styles.barWrapper}>
                  <div 
                    className={styles.bar} 
                    style={{ 
                      width: `${(stat._count._all / (apps || 1)) * 100}%`,
                      backgroundColor: "var(--color-primary)"
                    }} 
                  />
                  <span className={styles.barCount}>{stat._count._all}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const RISK_COLORS: Record<string, string> = {
  EXCELLENT: "var(--color-success)",
  GOOD: "var(--color-info)",
  FAIR: "var(--color-warning)",
  POOR: "var(--color-danger)",
};
