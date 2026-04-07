import { getSession } from "@/lib/session";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./layout.module.css";

const NAV = [
  { href: "/admin", icon: "◈", label: "Applications" },
  { href: "/admin/stats", icon: "♟", label: "Statistics" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.userId || session.role !== "admin") redirect("/login");

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
              {session.fullName?.charAt(0) ?? "A"}
            </div>
            <div>
              <div className="text-sm" style={{ fontWeight: 600 }}>{session.fullName}</div>
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
