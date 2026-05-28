"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Globe2, Moon, Sun } from "lucide-react";
import { Language, useLanguage } from "@/lib/LanguageContext";
import styles from "./PreferenceControls.module.css";

type Theme = "dark" | "light";

type PreferenceControlsProps = {
  className?: string;
  showLanguage?: boolean;
  showTheme?: boolean;
};

export default function PreferenceControls({
  className = "",
  showLanguage = true,
  showTheme = true,
}: PreferenceControlsProps) {
  const { language, setLanguage } = useLanguage();
  const [theme, setTheme] = useState<Theme>("dark");
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("dlem_theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      return;
    }

    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("dlem_theme", next);
    window.localStorage.setItem("dlem_admin_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  useEffect(() => {
    if (!languageOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (languageRef.current?.contains(event.target as Node)) return;
      setLanguageOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLanguageOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [languageOpen]);

  const chooseLanguage = (next: Language) => {
    setLanguage(next);
    setLanguageOpen(false);
  };

  return (
    <div className={`${styles.controls} ${className}`}>
      {showLanguage && (
        <div className={styles.languageControl} ref={languageRef}>
          <button
            type="button"
            className={styles.languageButton}
            aria-label="Language"
            aria-haspopup="menu"
            aria-expanded={languageOpen}
            onClick={() => setLanguageOpen((open) => !open)}
          >
            <Globe2 size={16} aria-hidden />
            <span>{language === "ny" ? "Chichewa" : "English"}</span>
            <ChevronDown size={16} className={styles.chevron} aria-hidden />
          </button>

          {languageOpen && (
            <div className={styles.languageMenu} role="menu">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={language === "en"}
                className={styles.languageOption}
                onClick={() => chooseLanguage("en")}
              >
                English
              </button>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={language === "ny"}
                className={styles.languageOption}
                onClick={() => chooseLanguage("ny")}
              >
                Chichewa
              </button>
            </div>
          )}
        </div>
      )}

      {showTheme && (
        <button
          type="button"
          onClick={toggleTheme}
          className={styles.themeButton}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <Sun size={19} aria-hidden /> : <Moon size={19} aria-hidden />}
        </button>
      )}
    </div>
  );
}
