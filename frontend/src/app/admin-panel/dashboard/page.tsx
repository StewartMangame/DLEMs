"use client";
import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  User,
  Calendar,
  CalendarDays,
  CircleCheck,
  Sun,
  BarChart3,
  Trophy,
  Building2,
  CheckCircle2,
  Zap,
  Megaphone,
  ArrowRight,
} from "lucide-react";
import { readJson } from "@/lib/http";
import { useLanguage } from "@/lib/LanguageContext";
import styles from "./dashboard.module.css";

interface DashboardData {
  totalUsers: number;
  usersThisWeek: number;
  usersThisMonth: number;
  checksToday: number;
  checksThisMonth: number;
  topInstitutions: { name: string; count: string }[];
  activeInstitutions: number;
}

function StatCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        {Icon && <Icon className={styles.statIcon} size={18} aria-hidden />}
        <span className={styles.statLabel}>{label}</span>
      </div>
      <div className={styles.statValue} style={{ color: color || "var(--ap-text)" }}>
        {value}
      </div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <h2 className={styles.sectionTitle}>
      <Icon className={styles.sectionTitleIcon} size={18} aria-hidden />
      {children}
    </h2>
  );
}

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin-panel/dashboard")
      .then((r) => readJson<DashboardData>(r, t("admin.dashboard.loadFailed")))
      .then(setData)
      .catch(() => setError(t("admin.dashboard.loadFailed")))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        {t("admin.dashboard.loading")}
      </div>
    );
  if (error) return <div className={styles.error}>{error}</div>;
  if (!data) return null;

  const quickLinks: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/admin-panel/institutions", label: t("admin.dashboard.manageInstitutions"), icon: Building2 },
    { href: "/admin-panel/users", label: t("admin.dashboard.viewUsers"), icon: Users },
    { href: "/admin-panel/announcements", label: t("admin.nav.announcements"), icon: Megaphone },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t("admin.nav.dashboard")}</h1>
        <p className={styles.pageSub}>{t("admin.dashboard.subtitle")}</p>
      </div>

      <section className={styles.section}>
        <SectionTitle icon={Users}>{t("admin.dashboard.overview")}</SectionTitle>
        <div className={styles.grid3}>
          <StatCard icon={User} label={t("admin.dashboard.totalUsers")} value={data.totalUsers.toLocaleString()} />
          <StatCard icon={Calendar} label={t("admin.dashboard.newThisWeek")} value={data.usersThisWeek} color="var(--ap-info)" />
          <StatCard icon={CalendarDays} label={t("admin.dashboard.newThisMonth")} value={data.usersThisMonth} color="var(--ap-accent-light)" />
        </div>
      </section>

      <section className={styles.section}>
        <SectionTitle icon={CircleCheck}>{t("admin.dashboard.eligibilityChecks")}</SectionTitle>
        <div className={styles.grid2}>
          <StatCard icon={Sun} label={t("admin.dashboard.checksToday")} value={data.checksToday} color="var(--ap-warning)" />
          <StatCard icon={BarChart3} label={t("admin.dashboard.checksThisMonth")} value={data.checksThisMonth} color="var(--ap-success)" />
        </div>
      </section>

      <section className={styles.section}>
        <SectionTitle icon={Trophy}>{t("admin.dashboard.topInstitutions")}</SectionTitle>
        <div className={styles.topInstList}>
          {data.topInstitutions.length === 0 ? (
            <div className={styles.emptyNote}>{t("admin.dashboard.noCheckData")}</div>
          ) : (
            data.topInstitutions.map((inst, i) => (
              <div key={inst.name} className={styles.topInstRow}>
                <span className={styles.topInstRank}>#{i + 1}</span>
                <span className={styles.topInstName}>{inst.name}</span>
                <span className={styles.topInstCount}>{Number(inst.count).toLocaleString()} {t("admin.dashboard.checks")}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className={styles.section}>
        <SectionTitle icon={Building2}>{t("admin.dashboard.institutionHealth")}</SectionTitle>
        <div className={styles.grid2}>
          <StatCard icon={CheckCircle2} label={t("admin.dashboard.activeInstitutions")} value={data.activeInstitutions} color="var(--ap-success)" />
        </div>
      </section>

      <section className={styles.section}>
        <SectionTitle icon={Zap}>{t("admin.dashboard.quickActions")}</SectionTitle>
        <div className={styles.quickLinks}>
          {quickLinks.map((link) => {
            const LinkIcon = link.icon;
            return (
              <a key={link.href} href={link.href} className={styles.quickLink}>
                <LinkIcon size={16} aria-hidden />
                <span className={styles.quickLinkLabel}>{link.label}</span>
                <ArrowRight size={14} className={styles.quickLinkArrow} aria-hidden />
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}
