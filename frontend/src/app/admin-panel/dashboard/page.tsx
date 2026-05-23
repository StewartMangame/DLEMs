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
  AlertTriangle,
  Zap,
  Megaphone,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import styles from "./dashboard.module.css";

interface DashboardData {
  totalUsers: number;
  usersThisWeek: number;
  usersThisMonth: number;
  checksToday: number;
  checksThisMonth: number;
  topInstitutions: { name: string; count: string }[];
  activeInstitutions: number;
  pendingVerification: number;
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin-panel/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        Loading dashboard…
      </div>
    );
  if (error) return <div className={styles.error}>{error}</div>;
  if (!data) return null;

  const quickLinks: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/admin-panel/institutions", label: "Manage Institutions", icon: Building2 },
    { href: "/admin-panel/users", label: "View Users", icon: Users },
    { href: "/admin-panel/announcements", label: "Announcements", icon: Megaphone },
    { href: "/admin-panel/activity-log", label: "Activity Log", icon: ClipboardList },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard Overview</h1>
        <p className={styles.pageSub}>Live system statistics — refreshed on every page load</p>
      </div>

      <section className={styles.section}>
        <SectionTitle icon={Users}>Users</SectionTitle>
        <div className={styles.grid3}>
          <StatCard icon={User} label="Total Registered Users" value={data.totalUsers.toLocaleString()} />
          <StatCard icon={Calendar} label="New This Week" value={data.usersThisWeek} color="var(--ap-info)" />
          <StatCard icon={CalendarDays} label="New This Month" value={data.usersThisMonth} color="var(--ap-accent-light)" />
        </div>
      </section>

      <section className={styles.section}>
        <SectionTitle icon={CircleCheck}>Eligibility Checks</SectionTitle>
        <div className={styles.grid2}>
          <StatCard icon={Sun} label="Checks Today" value={data.checksToday} color="var(--ap-warning)" />
          <StatCard icon={BarChart3} label="Checks This Month" value={data.checksThisMonth} color="var(--ap-success)" />
        </div>
      </section>

      <section className={styles.section}>
        <SectionTitle icon={Trophy}>Top 3 Most Checked Institutions</SectionTitle>
        <div className={styles.topInstList}>
          {data.topInstitutions.length === 0 ? (
            <div className={styles.emptyNote}>No eligibility check data yet.</div>
          ) : (
            data.topInstitutions.map((inst, i) => (
              <div key={inst.name} className={styles.topInstRow}>
                <span className={styles.topInstRank}>#{i + 1}</span>
                <span className={styles.topInstName}>{inst.name}</span>
                <span className={styles.topInstCount}>{Number(inst.count).toLocaleString()} checks</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className={styles.section}>
        <SectionTitle icon={Building2}>Institution Health</SectionTitle>
        <div className={styles.grid2}>
          <StatCard icon={CheckCircle2} label="Active Institutions" value={data.activeInstitutions} color="var(--ap-success)" />
          <StatCard
            icon={AlertTriangle}
            label="Pending Verification"
            value={data.pendingVerification}
            color={data.pendingVerification > 0 ? "var(--ap-warning)" : "var(--ap-success)"}
            sub={data.pendingVerification > 0 ? "Require review" : "All verified"}
          />
        </div>
      </section>

      <section className={styles.section}>
        <SectionTitle icon={Zap}>Quick Actions</SectionTitle>
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
