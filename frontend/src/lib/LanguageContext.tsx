"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ny";

interface DefaultTranslations {
  [key: string]: string;
}

const translations: Record<Language, DefaultTranslations> = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.profile": "Financial Profile",
    "nav.institutions": "Check Eligibility",
    "nav.compare": "Compare Lenders",
    "nav.loans": "Active Loans",
    "nav.calculator": "Calculator",
    "nav.logout": "Sign Out",
    "theme.light": "☀️ Light Mode",
    "theme.dark": "🌙 Dark Mode",
    "action.apply": "+ Compare Lenders",
    "action.checkEligibility": "🏦 Check Eligibility",
    "home.welcome": "Welcome",
    "home.noBank": "No Bank",
    "home.completeProfile": "Complete your financial profile",
    "home.unlockMsg": "to unlock loan eligibility checks and applications.",
    "home.setupLink": "Set up profile →",
    "home.salary": "Monthly Salary",
    "home.dti": "DTI Ratio",
    "home.activePrincipal": "Active Principal",
    "home.risk": "Risk Level",
  },
  ny: {
    "nav.dashboard": "Zoyang'anira",
    "nav.profile": "Mbiri Yachuma",
    "nav.institutions": "Yang'anani Mwayi",
    "nav.compare": "Yerekezerani Mabanki",
    "nav.loans": "Ngongole Zomwe Zilipo",
    "nav.calculator": "Makina Owerengera",
    "nav.logout": "Tulukani",
    "theme.light": "☀️ Kuwala",
    "theme.dark": "🌙 Mdima",
    "action.apply": "+ Yerekezerani Mabanki",
    "action.checkEligibility": "🏦 Yang'anani Mwayi",
    "home.welcome": "Takulandirani",
    "home.noBank": "Palibe Banki",
    "home.completeProfile": "Lembani mbiri yanu yachuma",
    "home.unlockMsg": "kuti mutsegule mwayi woyang'ana ndikufunsira ngongole.",
    "home.setupLink": "Konzani mbiri →",
    "home.salary": "Malipiro Apamwezi",
    "home.dti": "Kuchuluka kwa Ngongole (DTI)",
    "home.activePrincipal": "Ngongole Yotsala",
    "home.risk": "Mulingo Wa Chiwopsezo",
  }
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("dlem_lang") as Language;
    if (saved && (saved === "en" || saved === "ny")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("dlem_lang", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
