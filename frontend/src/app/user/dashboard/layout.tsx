"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./layout.module.css";
import { LanguageProvider, useLanguage } from "@/lib/LanguageContext";

type Theme = "dark" | "light";

const NAV_ITEMS = [
  { href: "/user/dashboard", icon: "D", key: "nav.dashboard" },
  { href: "/user/dashboard/profile", icon: "P", key: "nav.profile" },
  { href: "/user/dashboard/institutions", icon: "I", key: "nav.institutions" },
  { href: "/user/dashboard/eligibility", icon: "C", key: "nav.compare" },
  { href: "/user/dashboard/loans", icon: "L", key: "nav.loans" },
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
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>D</span>
            <span className={styles.logoText}>DLEM</span>
          </Link>
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
              <span className={styles.navIcon} aria-hidden="true">
                {item.icon}
              </span>
              <span>{t(item.key)}</span>
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.divider} />
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <span aria-hidden="true">X</span> {t("nav.logout")}
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
            >
              Menu
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
              style={{ padding: "8px 16px", minWidth: "140px" }}
            >
              {theme === "dark" ? t("theme.light") : t("theme.dark")}
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
