"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./layout.module.css";

const NAV = [
  { href: "/admin", icon: "◈", label: "Applications" },
  { href: "/admin/stats", icon: "♟", label: "Statistics" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => {
        if (r.status === 401 || r.status === 403) { router.push("/login"); return null; }
        return r.json();
      })
      .then(d => {
        if (d && d.user) {
          if (d.user.role !== 'admin' && d.user.role !== 'superadmin') {
             router.push("/dashboard");
             return;
          }
          setData(d.user);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) return <div style={{ padding: 40, color: "var(--color-text-muted)" }}>Loading portal…</div>;
  if (!data) return null;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⬡</span>
            <div>
              <div className={styles.logoText}>DLEM Admin</div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Credit Officer Portal</div>
            </div>
          </div>
        </div>
        <nav className={styles.nav}>
          {NAV.map(item => (
            <Link key={item.href} href={item.href} className={styles.navItem}>
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.officerBadge}>
            <div className={styles.officerAvatar}>
              {data.fullName?.charAt(0) ?? "A"}
            </div>
            <div>
              <div className="text-sm" style={{ fontWeight: 600 }}>{data.fullName}</div>
              <span className="badge badge-danger">ADMIN</span>
            </div>
          </div>
          <Link href="/" className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 12 }}>
            ← Back to Site
          </Link>
        </div>
      </aside>
      <main className={styles.main}>
        <Suspense fallback={<div style={{ padding: 40, color: "var(--color-text-muted)" }}>Loading…</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
