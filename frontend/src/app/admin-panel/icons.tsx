import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  Users,
  CircleCheck,
  Megaphone,
  KeyRound,
  Hexagon,
  Menu,
  LogOut,
  X,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  labelKey: string;
  icon: LucideIcon;
};

export const NAV_SUPER: AdminNavItem[] = [
  { href: "/admin-panel/dashboard", icon: LayoutDashboard, label: "Dashboard", labelKey: "admin.nav.dashboard" },
  { href: "/admin-panel/institutions", icon: Building2, label: "Institutions", labelKey: "admin.nav.institutions" },
  { href: "/admin-panel/users", icon: Users, label: "Users", labelKey: "admin.nav.users" },
  { href: "/admin-panel/eligibility", icon: CircleCheck, label: "Eligibility Monitor", labelKey: "admin.nav.eligibility" },
  { href: "/admin-panel/announcements", icon: Megaphone, label: "Announcements", labelKey: "admin.nav.announcements" },
  { href: "/admin-panel/admins", icon: KeyRound, label: "Admin Accounts", labelKey: "admin.nav.admins" },
];

export const NAV_CONTENT: AdminNavItem[] = [
  { href: "/admin-panel/dashboard", icon: LayoutDashboard, label: "Dashboard", labelKey: "admin.nav.dashboard" },
  { href: "/admin-panel/institutions", icon: Building2, label: "Institutions", labelKey: "admin.nav.institutions" },
  { href: "/admin-panel/announcements", icon: Megaphone, label: "Announcements", labelKey: "admin.nav.announcements" },
];

export { Hexagon, Menu, LogOut, X };

export function ModalCloseButton({
  onClose,
  className,
}: {
  onClose: () => void;
  className?: string;
}) {
  return (
    <button type="button" className={className} onClick={onClose} aria-label="Close">
      <X size={18} />
    </button>
  );
}
