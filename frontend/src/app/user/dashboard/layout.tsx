"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./layout.module.css";
import { useLanguage } from "@/lib/LanguageContext";
import { fetchActiveAnnouncements } from "@/lib/api";
import PreferenceControls from "@/components/PreferenceControls";
import {
  Hexagon,
  LayoutDashboard,
  UserCircle,
  Building2,
  Scale,
  Wallet,
  LogOut,
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

const SEEN_ANNOUNCEMENTS_KEY = "dlem_seen_announcements";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [seenAnnouncementIds, setSeenAnnouncementIds] = useState<string[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { t, language } = useLanguage();
  const sidebarRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const savedSeenIds = window.localStorage.getItem(SEEN_ANNOUNCEMENTS_KEY);
    if (savedSeenIds) {
      try {
        const parsed = JSON.parse(savedSeenIds);
        if (Array.isArray(parsed)) {
          setSeenAnnouncementIds(parsed.map(String));
        }
      } catch {
        window.localStorage.removeItem(SEEN_ANNOUNCEMENTS_KEY);
      }
    }

    fetchActiveAnnouncements()
      .then((data) => setAnnouncements(Array.isArray(data) ? data : []))
      .catch(() => setAnnouncements([]));
  }, []);

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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/user/login");
  };

  const unreadCount = announcements.filter(
    (announcement) => !seenAnnouncementIds.includes(String(announcement.id)),
  ).length;

  const markNotificationsAsSeen = () => {
    if (announcements.length === 0) return;

    const nextSeenIds = Array.from(
      new Set([
        ...seenAnnouncementIds,
        ...announcements.map((announcement) => String(announcement.id)),
      ]),
    );

    setSeenAnnouncementIds(nextSeenIds);
    window.localStorage.setItem(
      SEEN_ANNOUNCEMENTS_KEY,
      JSON.stringify(nextSeenIds),
    );
  };

  const toggleNotifications = () => {
    setNotificationsOpen((open) => {
      const nextOpen = !open;
      if (nextOpen) {
        markNotificationsAsSeen();
      }
      return nextOpen;
    });
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
              <PreferenceControls />

              <button
                onClick={toggleNotifications}
                className={styles.notificationBtn}
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                aria-haspopup="menu"
                title="Notifications"
              >
                <Bell size={24} strokeWidth={2.4} />
                {unreadCount > 0 && (
                  <span className={styles.notificationBadge}>
                    {unreadCount}
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
                  {unreadCount > 0 && (
                    <span className={styles.notificationsCount}>
                      {unreadCount}
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
  return <DashboardLayoutInner>{children}</DashboardLayoutInner>;
}
