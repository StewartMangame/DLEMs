"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";
import { NAV_SUPER, NAV_CONTENT, Hexagon, Menu, LogOut } from "./icons";
import styles from "./layout.module.css";

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
          <Hexagon className={styles.logoIcon} size={28} aria-hidden />
          <div>
            <div className={styles.logoText}>DLEM Admin</div>
            <div className={styles.logoRole}>
              {admin.role === "super_admin" ? "Super Administrator" : "Content Administrator"}
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          {nav.map(item => {
            const NavIcon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${pathname.startsWith(item.href) && item.href !== "/admin-panel/dashboard" ? styles.navActive : pathname === item.href ? styles.navActive : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <NavIcon className={styles.navIcon} size={18} aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminBadge}>
            <div className={styles.adminAvatar}>{admin.email?.[0]?.toUpperCase()}</div>
            <div>
              <div className={styles.adminEmail}>{admin.email}</div>
              <div className={styles.adminRolePill}>
                {admin.role === "super_admin" ? "Super Admin" : "Content Admin"}
              </div>
            </div>
          </div>
          <button type="button" onClick={logout} className={styles.logoutBtn}>
            <LogOut size={16} aria-hidden />
            Sign out
          </button>
        </div>
      </aside>

      <div className={styles.mainWrapper}>
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Open menu"
          >
            <Menu size={22} aria-hidden />
          </button>
          <span className={styles.topBarTitle}>DLEM Admin</span>
          <div className={styles.topBarActions}>
            <button
              type="button"
              onClick={toggleTheme}
              className={styles.themeToggle}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? (
                <Sun className={styles.themeIcon} aria-hidden />
              ) : (
                <Moon className={styles.themeIcon} aria-hidden />
              )}
            </button>
          </div>
        </header>
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}
