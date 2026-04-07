"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import styles from "./layout.module.css";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "◈", label: "Dashboard" },
  { href: "/dashboard/profile", icon: "◎", label: "My Profile" },
  { href: "/dashboard/eligibility", icon: "✦", label: "Eligibility" },
  { href: "/dashboard/apply", icon: "✚", label: "Apply for Loan" },
  { href: "/dashboard/calculator", icon: "⊞", label: "Calculator" },
  { href: "/dashboard/loans", icon: "◷", label: "My Loans" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className={styles.layout}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarTop}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>⬡</span>
            <span className={styles.logoText}>DLEM</span>
          </Link>
        </div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.divider} />
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <span>⎋</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.main}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <button
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <div className={styles.topbarActions}>
            <Link href="/dashboard/apply" className="btn btn-primary btn-sm">
              + Apply for Loan
            </Link>
          </div>
        </header>

        <main className={styles.content}>
          <Suspense fallback={<div style={{ padding: 40, color: "var(--color-text-muted)" }}>Loading content…</div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
