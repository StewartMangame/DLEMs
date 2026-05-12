"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import RepaymentButton from "./RepaymentButton";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-warning", APPROVED: "badge-success", REJECTED: "badge-danger", ACTIVE: "badge-info",
};
const RISK_BADGE: Record<string, string> = {
  EXCELLENT: "badge-success", GOOD: "badge-info", FAIR: "badge-warning", POOR: "badge-danger", UNKNOWN: "badge-neutral",
};

export default function LoansPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/loans")
      .then(r => {
        if (r.status === 401) {
          router.push("/user/login");
        }
        return r.json();
      })
      .then((data) => {
        const activeLoans = (data.loans || []).filter((l: any) => l.isActive);
        setLoans(activeLoans);
        setApplications(data.applications || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch loans:", err);
        setLoading(false);
      });
  }, [router]);

  if (loading) return <div style={{ padding: 40, color: "var(--color-text-muted)" }}>Loading loans…</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className="text-h2">My Loans</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Track your active loans and application history
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/user/dashboard/loans/add" className="btn btn-outline btn-sm">Record Manual Loan</Link>
        </div>
      </div>

      {loans.length > 0 && (
        <section className={styles.section}>
          <h2 className="text-h3">Active Loans</h2>
          <div className={styles.activeGrid}>
            {loans.map((loan: any) => {
              const progress = (loan.paidMonths / loan.loanTermMonths) * 100;
              return (
                <div key={loan.id} className={`card ${styles.activeLoanCard}`}>
                  <div className={styles.loanTop}>
                    <div>
                      <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                        {loan.application?.purpose || "Manual Record"} · {loan.providerInstitution?.name}
                      </div>
                      <div className="stat-value text-gradient">
                        MK {loan.loanAmount.toLocaleString()}
                      </div>
                    </div>
                    <span className="badge badge-info">Active</span>
                  </div>
                  <div className={styles.loanStats}>
                    <div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Monthly</div>
                      <div style={{ fontWeight: 600 }}>MK {loan.monthlyDeduction.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Paid Months</div>
                      <div style={{ fontWeight: 600 }}>{loan.paidMonths}/{loan.loanTermMonths}</div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Remaining</div>
                      <div style={{ fontWeight: 600, color: "var(--color-warning)" }}>
                        MK {Math.max(0, loan.remainingBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Start Date</div>
                      <div style={{ fontWeight: 600 }}>{new Date(loan.startDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{ margin: "16px 0" }}>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)", marginBottom: 8 }}>
                      Repayment Progress — {progress.toFixed(0)}%
                    </div>
                    <div className="progress-bar" style={{ height: 10 }}>
                      <div className="progress-fill success" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                    <div style={{ flexGrow: 1 }}>
                      <RepaymentButton loanId={loan.id} monthlyInstallment={loan.monthlyDeduction} />
                    </div>
                    <Link href={`/dashboard/loans/${loan.id}`} className="btn btn-outline" style={{ flexGrow: 1, justifyContent: "center" }}>
                      View Schedule
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className="text-h3">Application History</h2>
        {applications.length === 0 ? (
          <div className={`card ${styles.empty}`}>
            <div className={styles.emptyIcon}>📋</div>
            <h3 className="text-h3">No Applications Yet</h3>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Start by checking your eligibility or directly applying for a loan.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Link href="/user/dashboard/eligibility" className="btn btn-primary btn-sm">Compare Lenders</Link>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Date</th><th>Amount</th><th>Purpose</th><th>Bank</th><th>Duration</th><th>Risk</th><th>DTI</th><th>Status</th></tr>
              </thead>
              <tbody>
                {applications.map((app: any) => (
                  <tr key={app.id}>
                    <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td>MK {app.amount.toLocaleString()}</td>
                    <td>{app.purpose || "N/A"}</td>
                    <td>{app.institution?.name}</td>
                    <td>{app.durationMonths} mo</td>
                    <td>
                      <span className={`badge ${RISK_BADGE[app.riskCategory] ?? "badge-neutral"}`}>
                        {app.riskScore}/120 {app.riskCategory}
                      </span>
                    </td>
                    <td style={{ color: app.dtiRatio > 33 ? "var(--color-danger)" : "var(--color-success)" }}>
                      {app.dtiRatio.toFixed(1)}%
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[app.status] ?? "badge-neutral"}`}>{app.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
