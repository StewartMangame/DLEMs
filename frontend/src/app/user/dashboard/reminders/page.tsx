"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useLanguage } from "@/lib/LanguageContext";

export default function RemindersPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reminders")
      .then(r => {
        if (r.status === 401) { router.push("/user/login"); return null; }
        return r.json();
      })
      .then(d => { if (d) setReminders(d.reminders || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) return <div style={{ padding: 40, color: "var(--color-text-muted)" }}>{t("reminders.loading")}</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className="text-h2">{t("reminders.title")}</h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {t("reminders.subtitle")}
        </p>
      </div>

      <div className={styles.reminderList}>
        {reminders.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "var(--space-md)" }}>🔔</div>
            <h3 className="text-h3">{t("reminders.emptyTitle")}</h3>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {t("reminders.emptyDesc")}
            </p>
            <Link href="/user/dashboard/loans/add" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>
              {t("reminders.recordLoan")}
            </Link>
          </div>
        ) : (
          reminders.map((rem: any) => (
            <div key={rem.id} className={`card ${styles.reminderCard} ${rem.status === "SENT" ? styles.sent : ""}`}>
              <div className={styles.dateBox}>
                <div className={styles.month}>{new Date(rem.scheduledAt).toLocaleDateString(undefined, { month: "short" })}</div>
                <div className={styles.day}>{new Date(rem.scheduledAt).getDate()}</div>
              </div>
              <div className={styles.remInfo}>
                <h4 style={{ fontWeight: 700 }}>{t("reminders.deduction", { institution: rem.loan?.providerInstitution?.name || t("schedule.institution") })}</h4>
                <div className="text-sm">{t("reminders.amount")}: MK {rem.loan?.monthlyDeduction?.toLocaleString()}</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {t("reminders.scheduled")}: {new Date(rem.scheduledAt).toLocaleString()} · {t("reminders.status")}: {rem.status}
                </div>
              </div>
              <div className={styles.remStatusBadge}>
                {rem.deductionConfirmed ? (
                  <span className="badge badge-success">✓ {t("reminders.confirmed")}</span>
                ) : (
                  <span className="badge badge-warning">{t("reminders.pendingConfirmation")}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
