"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./layout.module.css";

const NAV_SUPER = [
  { href: "/admin-panel/dashboard", icon: "◉", label: "Dashboard" },
  { href: "/admin-panel/institutions", icon: "🏛", label: "Institutions" },
  { href: "/admin-panel/saccos", icon: "🤝", label: "SACCOs" },
  { href: "/admin-panel/users", icon: "👥", label: "Users" },
  { href: "/admin-panel/eligibility", icon: "✅", label: "Eligibility Monitor" },
  { href: "/admin-panel/loans", icon: "💰", label: "Loan Tracking" },
  { href: "/admin-panel/content", icon: "🌐", label: "Content & Language" },
  { href: "/admin-panel/announcements", icon: "📢", label: "Announcements" },
  { href: "/admin-panel/admins", icon: "🔑", label: "Admin Accounts" },
  { href: "/admin-panel/activity-log", icon: "📋", label: "Activity Log" },
];

const NAV_CONTENT = [
  { href: "/admin-panel/dashboard", icon: "◉", label: "Dashboard" },
  { href: "/admin-panel/institutions", icon: "🏛", label: "Institutions" },
  { href: "/admin-panel/content", icon: "🌐", label: "Content & Language" },
  { href: "/admin-panel/announcements", icon: "📢", label: "Announcements" },
];

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = (window.localStorage.getItem("dlem_admin_theme") as "dark" | "light") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("dlem_admin_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  useEffect(() => {
    if (pathname === "/admin-panel/login") { setLoading(false); return; }
    fetch("/api/admin-panel/auth/me", { credentials: "include" })
      .then(r => {
        if (!r.ok) { router.replace("/admin-panel/login"); return null; }
        return r.json();
      })
      .then(d => { if (d?.admin) setAdmin(d.admin); setLoading(false); })
      .catch(() => { router.replace("/admin-panel/login"); setLoading(false); });
  }, [pathname, router]);

  async function logout() {
    await fetch("/api/admin-panel/auth/logout", { method: "POST" });
    router.replace("/admin-panel/login");
  }

  // Don't wrap login page
  if (pathname === "/admin-panel/login") return <>{children}</>;
  if (loading) return (
    <div className={styles.loadScreen}>
      <div className={styles.loadSpinner} />
      <div>Verifying admin session…</div>
    </div>
  );
  if (!admin) return null;

  const nav = admin.role === "super_admin" ? NAV_SUPER : NAV_CONTENT;

  return (
    <div className={styles.layout}>
      {/* Mobile overlay */}
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.logoIcon}>⬡</span>
          <div>
            <div className={styles.logoText}>DLEM Admin</div>
            <div className={styles.logoRole}>
              {admin.role === "super_admin" ? "Super Administrator" : "Content Administrator"}
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          {nav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname.startsWith(item.href) && item.href !== "/admin-panel/dashboard" ? styles.navActive : pathname === item.href ? styles.navActive : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={toggleTheme} className={styles.logoutBtn} style={{ marginBottom: "1rem", border: "1px solid var(--ap-border)", background: "rgba(255,255,255,0.05)" }}>
            {theme === "dark" ? "☼ Switch to Light Mode" : "☾ Switch to Dark Mode"}
          </button>
          <div className={styles.adminBadge}>
            <div className={styles.adminAvatar}>{admin.email?.[0]?.toUpperCase()}</div>
            <div>
              <div className={styles.adminEmail}>{admin.email}</div>
              <div className={styles.adminRolePill}>
                {admin.role === "super_admin" ? "Super Admin" : "Content Admin"}
              </div>
            </div>
          </div>
          <button onClick={logout} className={styles.logoutBtn}>
            ← Sign out
          </button>
        </div>
      </aside>

      <div className={styles.mainWrapper}>
        <header className={styles.mobileHeader}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(v => !v)}>☰</button>
          <span className={styles.mobileTitle}>DLEM Admin</span>
        </header>
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}
