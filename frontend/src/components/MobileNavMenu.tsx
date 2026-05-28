"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import styles from "@/app/page.module.css";

export default function MobileNavMenu() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <div className={styles.mobileMenu}>
      <button
        type="button"
        className={styles.mobileMenuButton}
        aria-label="Open navigation menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreVertical size={22} aria-hidden />
      </button>
      {open && (
        <div className={styles.mobileMenuPanel}>
          <a href="#features" onClick={closeMenu}>Features</a>
          <a href="#how" onClick={closeMenu}>How It Works</a>
          <a href="#banks" onClick={closeMenu}>Partners</a>
        </div>
      )}
    </div>
  );
}
