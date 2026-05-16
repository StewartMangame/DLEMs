"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./layout.module.css";
import { 
  Hexagon, 
  LayoutDashboard, 
  Building2, 
  Users, 
  Scale, 
  Wallet, 
  Globe, 
  Megaphone, 
  Key, 
  List, 
  ArrowLeft,
  PieChart,
  Handshake
} from "lucide-react";

const NAV_SUPER = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/institutions", icon: Building2, label: "Institutions" },
  { href: "/admin/saccos", icon: Handshake, label: "SACCOs" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/eligibility", icon: Scale, label: "Eligibility Monitor" },
  { href: "/admin/loans", icon: Wallet, label: "Loan Tracking" },
  { href: "/admin/content", icon: Globe, label: "Content & Language" },
  { href: "/admin/announcements", icon: Megaphone, label: "Announcements" },
  { href: "/admin/admins", icon: Key, label: "Admin Accounts" },
  { href: "/admin/activity-log", icon: List, label: "Activity Log" },
];

const NAV_CONTENT = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/institutions", icon: Building2, label: "Institutions" },
  { href: "/admin/content", icon: Globe, label: "Content & Language" },
  { href: "/admin/announcements", icon: Megaphone, label: "Announcements" },
];

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") { setLoading(false); return; }
    fetch("/api/admin/auth/me", { credentials: "include" })
      .then(r => {
        if (!r.ok) { router.replace("/admin/login"); return null; }
        return r.json();
      })
      .then(d => { if (d?.admin) setAdmin(d.admin); setLoading(false); })
      .catch(() => { router.replace("/admin/login"); setLoading(false); });
  }, [pathname, router]);

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  // Don't wrap login page
  if (pathname === "/admin/login") return <>{children}</>;
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
          <Hexagon size={24} className={styles.logoIcon} />
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
              className={`${styles.navItem} ${pathname.startsWith(item.href) && item.href !== "/admin/dashboard" ? styles.navActive : pathname === item.href ? styles.navActive : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} className={styles.navIcon} />
              <span>{item.label}</span>
            </Link>
          ))}
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
          <Link href="/" className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 12, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> Back to Site
          </Link>
          <button onClick={logout} className={styles.logoutBtn} style={{ marginTop: 8 }}>
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

