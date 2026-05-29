"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { NAV_SUPER, NAV_CONTENT, Hexagon, Menu, LogOut } from "./icons";
import PreferenceControls from "@/components/PreferenceControls";
import { useLanguage } from "@/lib/LanguageContext";
import styles from "./layout.module.css";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();
  const sidebarRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    fetch("/api/admin-panel/auth/me", { credentials: "include" })
      .then(r => {
        if (!r.ok) { router.replace("/user/login"); return null; }
        return r.json();
      })
      .then(d => { if (d?.admin) setAdmin(d.admin); setLoading(false); })
      .catch(() => { router.replace("/user/login"); setLoading(false); });
  }, [pathname, router]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        sidebarRef.current?.contains(target) ||
        menuButtonRef.current?.contains(target)
      ) {
        return;
      }
      setSidebarOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [sidebarOpen]);

  async function logout() {
    await fetch("/api/admin-panel/auth/logout", { method: "POST" });
    router.replace("/user/login");
  }

  if (loading) return (
    <div className={styles.loadScreen}>
      <div className={styles.loadSpinner} />
      <div>{t("admin.verifying")}</div>
    </div>
  );
  if (!admin) return null;

  const nav = admin.role === "super_admin" ? NAV_SUPER : NAV_CONTENT;

  return (
    <div className={styles.layout}>
      <aside ref={sidebarRef} className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <Hexagon className={styles.logoIcon} size={28} aria-hidden />
          <div>
            <div className={styles.logoText}>{t("admin.title")}</div>
            <div className={styles.logoRole}>
              {admin.role === "super_admin" ? t("admin.superAdministrator") : t("admin.contentAdministrator")}
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
                <span>{t(item.labelKey, { default: item.label })}</span>
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
                {admin.role === "super_admin" ? t("admin.superAdmin") : t("admin.contentAdmin")}
              </div>
            </div>
          </div>
          <button type="button" onClick={logout} className={styles.logoutBtn}>
            <LogOut size={16} aria-hidden />
            {t("nav.logout")}
          </button>
        </div>
      </aside>

      <div className={styles.mainWrapper}>
        <header className={styles.topBar}>
          <div className={styles.topBarInner}>
            <button
              type="button"
              ref={menuButtonRef}
              className={styles.menuBtn}
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="Toggle menu"
              aria-expanded={sidebarOpen}
            >
              <Menu size={22} aria-hidden />
            </button>
            <span className={styles.topBarTitle}>{t("admin.title")}</span>
            <div className={styles.topBarActions}>
              <PreferenceControls />
            </div>
          </div>
        </header>
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}
