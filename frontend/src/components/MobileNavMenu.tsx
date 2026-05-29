"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import styles from "@/app/page.module.css";
import { useLanguage } from "@/lib/LanguageContext";

export default function MobileNavMenu() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const closeMenu = () => setOpen(false);

  return (
    <div className={styles.mobileMenu}>
      <button
        type="button"
        className={styles.mobileMenuButton}
        aria-label={t("common.openNavigation")}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreVertical size={22} aria-hidden />
      </button>
      {open && (
        <div className={styles.mobileMenuPanel}>
          <a href="#features" onClick={closeMenu}>{t("landing.nav.features")}</a>
          <a href="#how" onClick={closeMenu}>{t("landing.nav.how")}</a>
          <a href="#banks" onClick={closeMenu}>{t("landing.nav.partners")}</a>
        </div>
      )}
    </div>
  );
}
