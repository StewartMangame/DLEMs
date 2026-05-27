"use client";
import React, { createContext, useContext, useState } from "react";
import { fetchContentStrings } from "./api";

type Language = "en" | "ny";

type TranslationMap = Record<string, string>;

const translations: Record<Language, TranslationMap> = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.profile": "Financial Profile",
    "nav.institutions": "Check Eligibility",
    "nav.compare": "Compare Lenders",
    "nav.loans": "Active Loans",
    "nav.calculator": "Calculator",
    "nav.logout": "Sign Out",
    "theme.light": "Light Mode",
    "theme.dark": "Dark Mode",
    "action.apply": "Compare Lenders",
    "home.welcome": "Welcome",
    "home.noBank": "No Bank",
    "home.completeProfile": "Complete your financial profile",
    "home.unlockMsg": "to unlock loan eligibility checks and applications.",
    "home.setupLink": "Set up profile",
    "home.salary": "Monthly Salary",
    "home.dti": "DTI Ratio",
    "home.activePrincipal": "Active Principal",
    "home.risk": "Risk Level",
    "eligibility.title": "Loan Eligibility Comparison",
    "eligibility.subtitle":
      "Discover where you are likely to qualify and compare terms across Malawian lenders.",
    "eligibility.profileRequired": "You need to complete your",
    "eligibility.profileLink": "financial profile",
    "eligibility.profileRequiredEnd": "before generating a comparison.",
    "eligibility.parameters": "Loan Details",
    "eligibility.amount": "Requested Amount (MK)",
    "eligibility.period": "Repayment Period",
    "eligibility.periodHelp": "Choose your comfortable repayment timeframe",
    "eligibility.months": "months",
    "eligibility.years": "years",
    "eligibility.loading": "Scanning lenders...",
    "eligibility.check": "Check Eligibility",
    "eligibility.selectInstitution": "Select Institution",
    "eligibility.chooseInstitution": "Choose an institution",
    "eligibility.compareAllLendersInfo": "All active lenders are selected by default. Uncheck ones you do not want to include.",
    "eligibility.compare": "Compare Eligible Lenders",
    "eligibility.summarySalary": "Based on your net salary of",
    "eligibility.summaryDeductions": "and existing deductions of",
    "eligibility.topMatches": "Top Eligible Matches",
    "eligibility.noMatches":
      "No lenders matched your requested amount and profile. Check the ineligible list below to see why.",
    "eligibility.bestMatch": "Best Match",
    "eligibility.interestRate": "Interest Rate",
    "eligibility.processingFee": "Processing Fee",
    "eligibility.monthlyPayment": "Est. Monthly Payment",
    "eligibility.maxCapacity": "Max Capacity",
    "eligibility.prequalified": "Pre-qualified",
    "eligibility.visitBranch": "Visit any {institution} branch to proceed.",
    "eligibility.otherInstitutions": "Other Institutions (Not Eligible)",
    "eligibility.availableLenders": "Available Lenders on DLEM",
    "eligibility.offers": "Offers {rate}% interest rates up to {months} months.",
  },
  ny: {
    "nav.dashboard": "Zoyang'anira",
    "nav.profile": "Mbiri Yachuma",
    "nav.institutions": "Onani Mwayi",
    "nav.compare": "Yerekezerani Obwereketsa",
    "nav.loans": "Ngongole Zanga",
    "nav.calculator": "Chowerengera",
    "nav.logout": "Tulukani",
    "theme.light": "Mawonekedwe Owoneka",
    "theme.dark": "Mawonekedwe Amdima",
    "action.apply": "Yerekezerani Obwereketsa",
    "home.welcome": "Takulandirani",
    "home.noBank": "Palibe Banki",
    "home.completeProfile": "Malizitsani mbiri yanu ya zachuma",
    "home.unlockMsg": "kuti mutsegule kuyang'ana mwayi wa ngongole.",
    "home.setupLink": "Konzani mbiri",
    "home.salary": "Malipiro Apamwezi",
    "home.dti": "Chiwerengero cha Ngongole",
    "home.activePrincipal": "Ngongole Yotsala",
    "home.risk": "Mulingo wa Chiwopsezo",
    "eligibility.title": "Kuyerekeza Mwayi wa Ngongole",
    "eligibility.subtitle":
      "Onani komwe mungavomerezedwe ndipo yerekezerani mawu a obwereketsa ku Malawi.",
    "eligibility.profileRequired": "Muyenera kumaliza",
    "eligibility.profileLink": "mbiri yanu ya zachuma",
    "eligibility.profileRequiredEnd": "musanayambe kuyerekeza.",
    "eligibility.parameters": "Zambiri za Ngongole",
    "eligibility.amount": "Ndalama Zomwe Mukufuna (MK)",
    "eligibility.period": "Nthawi Yobweza",
    "eligibility.periodHelp": "Sankhani nthawi yobweza yomwe ingakuyenereni",
    "eligibility.months": "miyezi",
    "eligibility.years": "zaka",
    "eligibility.loading": "Tikuyang'ana obwereketsa...",
    "eligibility.check": "Onani Mwayi",
    "eligibility.compareAllLendersInfo": "Obwereketsa onse omwe alipo akusankhidwa mwachisawawa. Chotsani amene mukufuna osasinthidwa.",
    "eligibility.compare": "Yerekezerani Obwereketsa",
    "eligibility.selectInstitution": "Sankhani Obwereketsa",
    "eligibility.chooseInstitution": "Sankhani obwereketsa",
    "eligibility.summarySalary": "Zatengera malipiro anu a neti a",
    "eligibility.summaryDeductions": "ndi zobweza zina za",
    "eligibility.topMatches": "Obwereketsa Oyenera Kwambiri",
    "eligibility.noMatches":
      "Palibe wobwereketsa amene wagwirizana ndi ndalama zomwe mukufuna. Onani mndandanda wapansi kuti mudziwe chifukwa.",
    "eligibility.bestMatch": "Woyenera Kwambiri",
    "eligibility.interestRate": "Chiwongola Dzanja",
    "eligibility.processingFee": "Ndalama Zokonza",
    "eligibility.monthlyPayment": "Zobweza Pamwezi",
    "eligibility.maxCapacity": "Malire a Ngongole",
    "eligibility.prequalified": "Mungayenerere",
    "eligibility.visitBranch": "Pitani ku nthambi ya {institution} kuti mupitirize.",
    "eligibility.otherInstitutions": "Ena Osayenerera",
    "eligibility.availableLenders": "Obwereketsa Omwe Alipo pa DLEM",
    "eligibility.offers":
      "Amapereka chiwongola dzanja cha {rate}% mpaka miyezi {months}.",
  },
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: "en",
  setLanguage: () => {},
  t: key => key,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("en");
  const [liveStrings, setLiveStrings] = useState<Record<Language, TranslationMap>>({
    en: {},
    ny: {},
  });

  React.useEffect(() => {
    const saved = window.localStorage.getItem("dlem_lang");
    if (saved === "ny" || saved === "en") {
      setLanguageState(saved);
    }
    fetchContentStrings()
      .then((rows) => {
        if (!Array.isArray(rows)) return;
        const next: Record<Language, TranslationMap> = { en: {}, ny: {} };
        rows.forEach((row: { key: string; english: string; chichewa: string }) => {
          next.en[row.key] = row.english;
          next.ny[row.key] = row.chichewa;
        });
        setLiveStrings(next);
      })
      .catch(() => undefined);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    window.localStorage.setItem("dlem_lang", lang);
  };

  const t = (
    key: string,
    values: Record<string, string | number> = {},
  ): string => {
    let template =
      liveStrings[language][key] ||
      liveStrings.en[key] ||
      translations[language][key] ||
      translations.en[key] ||
      key;
    Object.entries(values).forEach(([name, value]) => {
      template = template.replace(`{${name}}`, String(value));
    });
    return template;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
