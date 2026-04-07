import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import styles from "./page.module.css";
import Link from "next/link";

export const metadata = { title: "Deduction Reminders | DLEM" };

export default async function RemindersPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const reminders = await (prisma as any).reminder.findMany({
    where: { userId: session.userId },
    include: {
      loan: {
        include: { providerInstitution: true }
      }
    },
    orderBy: { scheduledAt: "asc" },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className="text-h2">Upcoming Reminders</h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Ensure funds are available on your account for these scheduled loan deductions.
        </p>
      </div>

      <div className={styles.reminderList}>
        {reminders.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>🔔</div>
            <h3 className="text-h3">No upcoming reminders</h3>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Reminders are automatically generated based on your loan start dates.
            </p>
          </div>
        ) : (
          reminders.map((rem: any) => (
            <div key={rem.id} className={`card ${styles.reminderCard} ${rem.status === 'SENT' ? styles.sent : ''}`}>
              <div className={styles.dateBox}>
                <div className={styles.month}>{new Date(rem.scheduledAt).toLocaleDateString(undefined, { month: 'short' })}</div>
                <div className={styles.day}>{new Date(rem.scheduledAt).getDate()}</div>
              </div>
              <div className={styles.remInfo}>
                <h4 style={{ fontWeight: 700 }}>{rem.loan.providerInstitution.name} Deduction</h4>
                <div className="text-sm">Amount: MK {rem.loan.monthlyDeduction.toLocaleString()}</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Scheduled: {new Date(rem.scheduledAt).toLocaleTimeString()} · Status: {rem.status}
                </div>
              </div>
              <div className={styles.remStatusBadge}>
                {rem.deductionConfirmed ? (
                    <span className="badge badge-success">✓ Confirmed</span>
                ) : (
                    <span className="badge badge-warning">Pending Confirmation</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
