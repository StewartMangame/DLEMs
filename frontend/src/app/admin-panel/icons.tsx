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
  icon: LucideIcon;
};

export const NAV_SUPER: AdminNavItem[] = [
  { href: "/admin-panel/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin-panel/institutions", icon: Building2, label: "Institutions" },
  { href: "/admin-panel/users", icon: Users, label: "Users" },
  { href: "/admin-panel/eligibility", icon: CircleCheck, label: "Eligibility Monitor" },
  { href: "/admin-panel/announcements", icon: Megaphone, label: "Announcements" },
  { href: "/admin-panel/admins", icon: KeyRound, label: "Admin Accounts" },
];

export const NAV_CONTENT: AdminNavItem[] = [
  { href: "/admin-panel/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin-panel/institutions", icon: Building2, label: "Institutions" },
  { href: "/admin-panel/announcements", icon: Megaphone, label: "Announcements" },
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
