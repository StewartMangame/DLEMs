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
  FileText,
  PieChart,
  ArrowLeft
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/user/dashboard", icon: LayoutDashboard, key: "nav.dashboard" },
  { href: "/user/dashboard/profile", icon: UserCircle, key: "nav.profile" },
  { href: "/user/dashboard/institutions", icon: Building2, key: "nav.institutions" },
  { href: "/user/dashboard/eligibility", icon: Scale, key: "nav.compare" },
  { href: "/user/dashboard/loans", icon: Wallet, key: "nav.loans" },
];

function getSavedTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem("dlem_theme") === "light"
    ? "light"
    : "dark";
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(getSavedTheme);
  const pathname = usePathname();
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();

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

          {/* Right side: Language + Theme */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
          </div>
        </header>
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
