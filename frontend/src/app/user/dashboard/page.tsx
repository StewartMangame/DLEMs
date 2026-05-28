"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useLanguage } from "@/lib/LanguageContext";
import { readJson } from "@/lib/http";
import { 
  Info, 
  Building2, 
  Scale, 
  PlusCircle, 
  Clock, 
  UserCircle 
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => {
        if (r.status === 401) {
          router.push("/user/login");
          return null;
        }
        return readJson(r, "Failed to load dashboard");
      })
      .then(d => { if (d) setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) return <div style={{ padding: 40, color: "var(--color-text-muted)" }}>Loading dashboard…</div>;
  if (!data) return null;

  const { user, profile, activeLoans, applications } = data;
  const totalActiveDebt = (activeLoans || []).reduce((acc: number, loan: any) => acc + (loan.remainingBalance || 0), 0);
  const totalMonthlyDebt = (profile?.existingLoanAmount || 0) + (activeLoans || []).reduce((s: number, l: any) => s + l.monthlyDeduction, 0);
  const dtiRatio = profile ? (totalMonthlyDebt / profile.monthlyNetSalary) * 100 : 0;
  const creditUtilization = profile ? ((profile.totalBorrowedAmount || 0) / (profile.monthlyNetSalary * 12 * 4)) * 100 : 0;

  const insights: { type: "danger" | "warning" | "success"; text: string }[] = [];
  if (dtiRatio > 33) {
    insights.push({ type: "danger", text: t("home.insightHighRisk") });
  } else if (dtiRatio >= 20) {
    insights.push({ type: "warning", text: t("home.insightModerateRisk") });
  } else {
    insights.push({ type: "success", text: t("home.insightLowRisk") });
  }
  if (profile && (profile.monthlyNetSalary * 0.33) > totalMonthlyDebt) {
    insights.push({ type: "success", text: t("home.insightCapacity") });
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className="text-h2">
            {t("home.welcome")}, <span className="text-gradient">{user?.fullName?.split(" ")[0]}</span>
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Emp. ID: {user?.employeeNumber} · {profile?.salaryInstitution?.name || t("home.noBank")} · {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {!profile && (
        <div className={`alert alert-info ${styles.profileAlert}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Info size={24} />
          <div>
            <strong>{t("home.completeProfile")}</strong> {t("home.unlockMsg")}{" "}
            <Link href="/user/dashboard/profile">{t("home.setupLink")}</Link>
          </div>
        </div>
      )}

      <div className={`grid-4 ${styles.kpiGrid}`}>
        <div className={`card ${styles.kpiCard}`}>
          <div className="stat-label">{t("home.salary")}</div>
          <div className="stat-value" style={{ color: "var(--color-success)" }}>
            {profile ? `MK ${profile.monthlyNetSalary.toLocaleString()}` : "—"}
          </div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("home.netIncome")}</div>
        </div>
        <div className={`card ${styles.kpiCard}`}>
          <div className="stat-label">{t("home.dti")}</div>
          <div className="stat-value" style={{ color: dtiRatio > 33 ? "var(--color-danger)" : dtiRatio >= 20 ? "var(--color-warning)" : "var(--color-success)" }}>
            {profile ? `${dtiRatio.toFixed(1)}%` : "—"}
          </div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("home.threshold")}</div>
        </div>
        <div className={`card ${styles.kpiCard}`}>
          <div className="stat-label">{t("home.activePrincipal")}</div>
          <div className="stat-value" style={{ color: "var(--color-warning)" }}>
            MK {totalActiveDebt.toLocaleString()}
          </div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("home.remainingBalance")}</div>
        </div>
        <div className={`card ${styles.kpiCard}`}>
          <div className="stat-label">{t("home.risk")}</div>
          <div className="stat-value" style={{ color: dtiRatio > 33 ? "var(--color-danger)" : dtiRatio >= 20 ? "var(--color-warning)" : "var(--color-success)" }}>
            {dtiRatio > 33 ? t("home.high") : dtiRatio >= 20 ? t("home.moderate") : t("home.low")}
          </div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("home.riskCategory")}</div>
        </div>
      </div>

      {profile && (
        <div className={`grid-2 ${styles.healthRow}`}>
          <div className={`card ${styles.healthCard}`}>
            <h3 className="text-h3">{t("home.debtAnalysis")}</h3>
            <div className="progress-bar" style={{ height: 12, marginTop: 16 }}>
              <div
                className={`progress-fill ${dtiRatio > 33 ? "danger" : dtiRatio >= 20 ? "warning" : ""}`}
                style={{ width: `${Math.min(dtiRatio, 100)}%` }}
              />
            </div>
            <div className={styles.dtiScale}>
              <span>0%</span><span>Low</span><span>20%</span><span>Mod</span><span>33%</span><span>High</span>
            </div>
            <h3 className="text-h3" style={{ marginTop: 24 }}>{t("home.creditUtilization")}</h3>
            <div className="progress-bar" style={{ height: 12, marginTop: 16 }}>
              <div
                className={`progress-fill ${creditUtilization > 70 ? "danger" : creditUtilization > 40 ? "warning" : ""}`}
                style={{ width: `${Math.min(creditUtilization, 100)}%` }}
              />
            </div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)", marginTop: 8 }}>
              {t("home.utilizing", { percent: creditUtilization.toFixed(1) })}
            </p>
          </div>

          <div className={`card ${styles.healthCard}`}>
            <h3 className="text-h3">{t("home.smartInsights")}</h3>
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

      <div className={styles.actionsSection}>
        <h2 className="text-h3">{t("home.quickActions")}</h2>
        <div className={styles.actions}>
          {ACTIONS.map((a, i) => (
            <Link key={i} href={a.href} className={`card card-hover ${styles.actionCard}`}>
              <div className={styles.actionIcon} style={{ background: a.color }}>
                <a.icon size={20} color="var(--color-text-primary)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{t(a.titleKey)}</div>
                <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{t(a.descKey)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {(applications || []).length > 0 && (
        <div className={styles.appsSection}>
          <div className={styles.appsHeader}>
            <h2 className="text-h3">{t("home.recentApplications")}</h2>
            <Link href="/user/dashboard/loans" className="btn btn-ghost btn-sm">{t("home.viewAll")}</Link>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t("home.date")}</th><th>{t("home.amount")}</th><th>{t("home.duration")}</th><th>{t("home.riskScore")}</th><th>{t("home.status")}</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app: any) => (
                  <tr key={app.id}>
                    <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td>MK {app.amount.toLocaleString()}</td>
                    <td>{app.durationMonths} {t("home.months")}</td>
                    <td>
                      <span className={`badge ${RISK_BADGE[app.riskCategory] ?? "badge-neutral"}`}>
                        {app.riskScore}/120 · {app.riskCategory}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[app.status] ?? "badge-neutral"}`}>{app.status}</span>
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
  { href: "/user/dashboard/institutions", icon: Building2, titleKey: "home.actionCheckTitle", descKey: "home.actionCheckDesc", color: "var(--color-success-bg)" },
  { href: "/user/dashboard/eligibility",  icon: Scale,     titleKey: "home.actionCompareTitle", descKey: "home.actionCompareDesc", color: "var(--color-primary-glow)" },
  { href: "/user/dashboard/loans/add",    icon: PlusCircle, titleKey: "home.actionRecordTitle", descKey: "home.actionRecordDesc", color: "var(--color-warning-bg)" },
  { href: "/user/dashboard/loans",        icon: Clock,      titleKey: "home.actionLoansTitle", descKey: "home.actionLoansDesc", color: "var(--color-danger-bg)" },
  { href: "/user/dashboard/profile",      icon: UserCircle, titleKey: "home.actionProfileTitle", descKey: "home.actionProfileDesc", color: "rgba(0,180,216,0.15)" },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-warning", APPROVED: "badge-success", REJECTED: "badge-danger", ACTIVE: "badge-info",
};
const RISK_BADGE: Record<string, string> = {
  EXCELLENT: "badge-success", GOOD: "badge-info", FAIR: "badge-warning", POOR: "badge-danger", UNKNOWN: "badge-neutral",
};

