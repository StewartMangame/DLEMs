"use client";
import { useState, useEffect } from "react";
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
  placeholderStrings: number;
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: number | string; sub?: string; color?: string; icon?: string }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <span className={styles.statIcon}>{icon}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
      <div className={styles.statValue} style={{ color: color || "var(--ap-text)" }}>{value}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      Loading dashboard…
    </div>
  );
  if (error) return <div className={styles.error}>{error}</div>;
  if (!data) return null;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard Overview</h1>
        <p className={styles.pageSub}>Live system statistics — refreshed on every page load</p>
      </div>

      {/* User Stats */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>👥 Users</h2>
        <div className={styles.grid3}>
          <StatCard icon="👤" label="Total Registered Users" value={data.totalUsers.toLocaleString()} />
          <StatCard icon="📅" label="New This Week" value={data.usersThisWeek} color="var(--ap-info)" />
          <StatCard icon="🗓" label="New This Month" value={data.usersThisMonth} color="var(--ap-accent-light)" />
        </div>
      </section>

      {/* Eligibility Stats */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>✅ Eligibility Checks</h2>
        <div className={styles.grid2}>
          <StatCard icon="☀️" label="Checks Today" value={data.checksToday} color="var(--ap-warning)" />
          <StatCard icon="📊" label="Checks This Month" value={data.checksThisMonth} color="var(--ap-success)" />
        </div>
      </section>

      {/* Top Institutions */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🏆 Top 3 Most Checked Institutions</h2>
        <div className={styles.topInstList}>
          {data.topInstitutions.length === 0 ? (
            <div className={styles.emptyNote}>No eligibility check data yet.</div>
          ) : data.topInstitutions.map((inst, i) => (
            <div key={inst.name} className={styles.topInstRow}>
              <span className={styles.topInstRank}>#{i + 1}</span>
              <span className={styles.topInstName}>{inst.name}</span>
              <span className={styles.topInstCount}>{Number(inst.count).toLocaleString()} checks</span>
            </div>
          ))}
        </div>
      </section>

      {/* Institution Health */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🏛 Institution Health</h2>
        <div className={styles.grid3}>
          <StatCard icon="✓" label="Active Institutions" value={data.activeInstitutions} color="var(--ap-success)" />
          <StatCard
            icon="⚠️"
            label="Pending Verification"
            value={data.pendingVerification}
            color={data.pendingVerification > 0 ? "var(--ap-warning)" : "var(--ap-success)"}
            sub={data.pendingVerification > 0 ? "Require review" : "All verified"}
          />
          <StatCard
            icon="🌐"
            label="Untranslated Strings"
            value={data.placeholderStrings}
            color={data.placeholderStrings > 0 ? "var(--ap-warning)" : "var(--ap-success)"}
            sub="Chichewa placeholders"
          />
        </div>
      </section>

      {/* Quick Links */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>⚡ Quick Actions</h2>
        <div className={styles.quickLinks}>
          {[
            { href: "/admin/institutions", label: "Manage Institutions", icon: "🏛" },
            { href: "/admin/saccos", label: "Manage SACCOs", icon: "🤝" },
            { href: "/admin/users", label: "View Users", icon: "👥" },
            { href: "/admin/content?status=placeholder", label: "Translate Strings", icon: "🌐" },
            { href: "/admin/announcements", label: "Announcements", icon: "📢" },
            { href: "/admin/activity-log", label: "Activity Log", icon: "📋" },
          ].map(link => (
            <a key={link.href} href={link.href} className={styles.quickLink}>
              <span>{link.icon}</span>
              {link.label} →
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
