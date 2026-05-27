"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./layout.module.css";
import { LanguageProvider, useLanguage } from "@/lib/LanguageContext";
import { fetchActiveAnnouncements } from "@/lib/api";
import {
  Hexagon,
  LayoutDashboard,
  UserCircle,
  Building2,
  Scale,
  Wallet,
  LogOut,
  Sun,
  Moon,
  Menu,
  ArrowLeft,
  Bell,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/user/dashboard", icon: LayoutDashboard, key: "nav.dashboard" },
  { href: "/user/dashboard/profile", icon: UserCircle, key: "nav.profile" },
  { href: "/user/dashboard/institutions", icon: Building2, key: "nav.institutions" },
  { href: "/user/dashboard/eligibility", icon: Scale, key: "nav.compare" },
  { href: "/user/dashboard/loans", icon: Wallet, key: "nav.loans" },
];

type Theme = "dark" | "light";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const sidebarRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = window.localStorage.getItem("dlem_theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme as Theme);
      }
    }

    fetchActiveAnnouncements()
      .then((data) => setAnnouncements(Array.isArray(data) ? data : []))
      .catch(() => setAnnouncements([]));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("dlem_theme", next);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/user/login");
  };

  return (
    <div className={styles.layout}>
      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${
          sidebarOpen ? styles.sidebarOpen : ""
        }`}
      >
        <div className={styles.sidebarTop}>
          <div className={styles.logo}>
            <Hexagon size={24} className={styles.logoIcon} />
            <div>
              <div className={styles.logoText}>DLEM</div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Portal</div>
            </div>
          </div>
        </div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${
                pathname === item.href ? styles.navItemActive : ""
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} className={styles.navIcon} />
              <span>{t(item.key)}</span>
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.divider} />
          <Link href="/" className="btn btn-ghost btn-sm" style={{ width: "100%", marginBottom: 12, display: "flex", alignItems: "center", gap: "8px" }}>
            <ArrowLeft size={16} /> Back
          </Link>
          <button onClick={handleLogout} className={styles.logoutBtn} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LogOut size={18} /> {t("nav.logout")}
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarInner}>
            <button
              ref={menuButtonRef}
              className={styles.menuBtn}
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label="Toggle menu"
              aria-expanded={sidebarOpen}
            >
              <Menu size={20} />
            </button>

            <div className={styles.topbarActions} style={{ position: "relative" }}>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as "en" | "ny")}
                className="form-select"
                aria-label="Language"
              >
                <option value="en">English</option>
                <option value="ny">Chichewa</option>
              </select>

              <button
                onClick={toggleTheme}
                className="btn btn-ghost"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <>
                    <Sun size={18} /> {t("theme.light")}
                  </>
                ) : (
                  <>
                    <Moon size={18} /> {t("theme.dark")}
                  </>
                )}
              </button>

              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={styles.notificationBtn}
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                aria-haspopup="menu"
                title="Notifications"
              >
                <Bell size={24} strokeWidth={2.4} />
                {announcements.length > 0 && (
                  <span className={styles.notificationBadge}>
                    {announcements.length}
                  </span>
                )}
              </button>

              <div
                className={styles.notificationsMenu}
                role="menu"
                hidden={!notificationsOpen}
              >
                <div className={styles.notificationsHeader}>
                  <span>Notifications</span>
                  {announcements.length > 0 && (
                    <span className={styles.notificationsCount}>
                      {announcements.length}
                    </span>
                  )}
                </div>
                {announcements.length === 0 ? (
                  <p className={styles.notificationsEmpty}>
                    {t("home.noAnnouncements") || "No announcements"}
                  </p>
                ) : (
                  <>
                    {announcements.map((announcement) => (
                      <div key={announcement.id} className={styles.notificationItem} role="menuitem">
                        {language === "ny"
                          ? announcement.message_chichewa || announcement.message_english
                          : announcement.message_english}
                      </div>
                    ))}
                    <div className={styles.notificationsFooter}>
                      <Link href="/user/dashboard/announcements" className="btn btn-ghost btn-sm">
                        {t("home.viewAllAnnouncements") || "View all announcements"}
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className={styles.content}>
          <Suspense
            fallback={
              <div
                style={{ padding: 40, color: "var(--color-text-muted)" }}
              >
                Loading content...
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </LanguageProvider>
  );
}
