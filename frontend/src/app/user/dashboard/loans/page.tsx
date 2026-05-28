"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import RepaymentButton from "./RepaymentButton";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-warning", APPROVED: "badge-success", REJECTED: "badge-danger", ACTIVE: "badge-info",
};
const RISK_BADGE: Record<string, string> = {
  EXCELLENT: "badge-success", GOOD: "badge-info", FAIR: "badge-warning", POOR: "badge-danger", UNKNOWN: "badge-neutral",
};

export default function LoansPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loans, setLoans] = useState<any[]>([]);
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
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch loans:", err);
        setLoading(false);
      });
  }, [router]);

  if (loading) return <div style={{ padding: 40, color: "var(--color-text-muted)" }}>{t("loans.loading")}</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link href="/user/dashboard" className="btn btn-ghost btn-sm" style={{ gap: "8px", marginBottom: "var(--space-md)" }}>
            <ArrowLeft size={16} /> {t("common.back")}
          </Link>
          <h1 className="text-h2">{t("loans.title")}</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {t("loans.subtitle")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/user/dashboard/loans/add" className="btn btn-outline btn-sm">{t("loans.record")}</Link>
        </div>
      </div>

      {loans.length > 0 && (
        <section className={styles.section}>
          <h2 className="text-h3">{t("loans.active")}</h2>
          <div className={styles.activeGrid}>
            {loans.map((loan: any) => {
              const progress = (loan.paidMonths / loan.loanTermMonths) * 100;
              return (
                <div key={loan.id} className={`card ${styles.activeLoanCard}`}>
                  <div className={styles.cardChrome}>
                    <span className="badge badge-info">{t("loans.active")}</span>
                    <button
                      onClick={() => {
                        if (confirm(t("loans.removeConfirm"))) {
                          fetch(`/api/loans/${loan.id}`, { method: "DELETE" })
                            .then(r => r.json())
                            .then(data => {
                              if (data.success) {
                                setLoans(prev => prev.filter(l => l.id !== loan.id));
                              }
                            });
                        }
                      }}
                      className={styles.deleteBtn}
                      title={t("loans.remove")}
                      aria-label={t("loans.remove")}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className={styles.loanTop}>
                    <div>
                      <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                        {loan.application?.purpose || t("loans.manualRecord")} - {loan.providerInstitution?.name}
                      </div>
                      <div className="stat-value text-gradient">
                        MK {loan.loanAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className={styles.loanStats}>
                    <div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("loans.monthly")}</div>
                      <div style={{ fontWeight: 600 }}>MK {loan.monthlyDeduction.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("loans.paidMonths")}</div>
                      <div style={{ fontWeight: 600 }}>{loan.paidMonths}/{loan.loanTermMonths}</div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("loans.remaining")}</div>
                      <div style={{ fontWeight: 600, color: "var(--color-warning)" }}>
                        MK {Math.max(0, loan.remainingBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("loans.startDate")}</div>
                      <div style={{ fontWeight: 600 }}>{new Date(loan.startDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{ margin: "16px 0" }}>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)", marginBottom: 8 }}>
                      {t("loans.progress")} - {progress.toFixed(0)}%
                    </div>
                    <div className="progress-bar" style={{ height: 10 }}>
                      <div className="progress-fill success" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                    <div style={{ flexGrow: 1 }}>
                      <RepaymentButton
                        loanId={loan.id}
                        remainingBalance={Math.max(0, loan.remainingBalance || 0)}
                        onComplete={() => setLoans(prev => prev.filter(l => l.id !== loan.id))}
                      />
                    </div>
                    <Link href={`/user/dashboard/loans/${loan.id}`} className="btn btn-outline" style={{ flexGrow: 1, justifyContent: "center" }}>
                      {t("loans.viewSchedule")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
