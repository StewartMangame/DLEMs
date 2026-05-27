"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./layout.module.css";
import { LanguageProvider, useLanguage } from "@/lib/LanguageContext";
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
<<<<<<< Updated upstream
  FileText,
  PieChart,
  ArrowLeft
=======
  ArrowLeft,
  Bell
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
>>>>>>> Stashed changes
  const pathname = usePathname();
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = window.localStorage.getItem("dlem_theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme as Theme);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      <aside
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
          {NAV_ITEMS.map(item => (
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
          <Link href="/" className="btn btn-ghost btn-sm" style={{ width: "100%", marginBottom: 12, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> Back to Site
          </Link>
          <button onClick={handleLogout} className={styles.logoutBtn} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogOut size={18} /> {t("nav.logout")}
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          {/* Left side: hamburger + Check Eligibility CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              className={styles.menuBtn}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Menu size={20} />
            </button>
            <Link
              href="/user/dashboard/institutions"
              className="btn btn-primary"
              style={{ padding: "8px 24px" }}
            >
              {t("action.checkEligibility")}
            </Link>
          </div>

<<<<<<< Updated upstream
          {/* Right side: Language + Theme */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
=======
          {/* Right side: Language + Theme + Notifications */}
          <div className={styles.topbarActions} style={{ position: 'relative' }}>
>>>>>>> Stashed changes
            <select
              value={language}
              onChange={event => setLanguage(event.target.value as "en" | "ny")}
              className="form-select"
              aria-label="Language"
              style={{
                padding: "6px 28px 6px 12px",
                minWidth: "125px",
                fontSize: "0.9rem",
                backgroundPosition: "right 8px center",
                border: "1px solid var(--color-border)",
              }}
            >
              <option value="en">English</option>
              <option value="ny">Chichewa</option>
            </select>

            <button
              onClick={toggleTheme}
              className="btn btn-ghost"
              aria-label="Toggle theme"
              style={{ padding: "8px 16px", minWidth: "140px", display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {theme === "dark" ? <><Sun size={18} /> {t("theme.light")}</> : <><Moon size={18} /> {t("theme.dark")}</>}
            </button>

            {/* Notifications button */}
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="btn btn-ghost"
              aria-label="Notifications"
              style={{ position: 'relative' }}
            >
              <Bell size={18} />
              {announcements.length > 0 && (
                <span style={{ position: 'absolute', top: -8, right: -8, background: 'var(--color-danger)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.75rem' }}>
                  {announcements.length}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '280px',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                display: notificationsOpen ? 'block' : 'none'
              }}
            >
              {announcements.length === 0 ? (
                <p style={{ padding: '12px', color: 'var(--color-text-muted)' }}>
                  {t('home.noAnnouncements') || 'No announcements'}
                </p>
              ) : (
                <>
                  {announcements.map((announcement) => (
                    <div key={announcement.id} style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                      {language === "ny"
                        ? announcement.message_chichewa || announcement.message_english
                        : announcement.message_english}
                    </div>
                  ))}
                  <div style={{ padding: '12px', textAlign: 'center' }}>
                    <Link href="/user/dashboard/announcements" className="btn btn-ghost btn-sm">
                      {t('home.viewAllAnnouncements') || 'View all announcements'}
                    </Link>
                  </div>
                </>
              )}
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