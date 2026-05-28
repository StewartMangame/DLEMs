"use client";

import { useEffect } from "react";
import { LanguageProvider } from "@/lib/LanguageContext";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("dlem_theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  return <LanguageProvider>{children}</LanguageProvider>;
}
