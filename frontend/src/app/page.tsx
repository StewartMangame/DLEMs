"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import PreferenceControls from "@/components/PreferenceControls";
import MobileNavMenu from "@/components/MobileNavMenu";
import { useLanguage } from "@/lib/LanguageContext";
import { 
  Hexagon, 
  Zap, 
  Globe, 
  Calculator, 
  Clock, 
  LayoutDashboard, 
  ShieldCheck, 
  Building2,
  ArrowRight
} from "lucide-react";

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className={styles.wrapper}>
      {/* ── Navigation ── */}
      <nav className={styles.nav}>
        <div className={`container ${styles.navInner}`}>
          <div className={styles.logo}>
            <Hexagon size={24} className={styles.logoIcon} />
            <span>DLEM</span>
          </div>
          <div className={styles.navLinks}>
            <a href="#features">{t("landing.nav.features")}</a>
            <a href="#how">{t("landing.nav.how")}</a>
            <a href="#banks">{t("landing.nav.partners")}</a>
          </div>
          <div className={styles.navCta}>
            <PreferenceControls />
            <MobileNavMenu />
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroBgOrb1} />
          <div className={styles.heroBgOrb2} />
          <div className={styles.heroBgGrid} />
        </div>
        <div className={`container ${styles.heroContent}`}>
          <h1 className={`text-display ${styles.heroTitle} animate-fadeInUp animate-delay-1`}>
            {t("landing.hero.title")}<br />
            <span className="text-gradient">{t("landing.hero.highlight")}</span>
          </h1>
          <p className={`text-body ${styles.heroSub} animate-fadeInUp animate-delay-2`}>
            {t("landing.hero.subtitle")}
          </p>
          <div className={`${styles.heroActions} animate-fadeInUp animate-delay-3`}>
            <Link href="/user/register" className="btn btn-primary btn-lg">
              {t("landing.hero.getStarted")} <ArrowRight size={20} style={{ marginLeft: 8 }} />
            </Link>
            <Link href="/user/login" className="btn btn-outline btn-lg">
              {t("landing.hero.signIn")}
            </Link>
          </div>

          <div className={`${styles.heroGraphic} animate-fadeInUp animate-delay-4`}>
            <div className={styles.heroImgFrame}>
              <Image
                src="/hero.png"
                alt="Fintech Interface Showcase"
                className={styles.heroImg}
                width={800}
                height={500}
                priority
              />
            </div>
            <div className={styles.heroImgGlow} />
          </div>

          <div className={`${styles.heroStats} animate-fadeInUp animate-delay-5`}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{t("landing.stats.institutions")}</span>
              <span className={styles.heroStatLabel}>{t("landing.stats.supported")}</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{t("landing.stats.time")}</span>
              <span className={styles.heroStatLabel}>{t("landing.stats.eligibility")}</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{t("landing.stats.digital")}</span>
              <span className={styles.heroStatLabel}>{t("landing.stats.process")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className="text-h2">{t("landing.features.title")}</h2>
            <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
              {t("landing.features.subtitle")}
            </p>
          </div>
          <div className={`grid-3 ${styles.featuresGrid}`}>
            {FEATURES.filter((f) => !HIDDEN_FEATURES.has(f.titleKey)).map((f, i) => (
              <div key={i} className={`card card-hover ${styles.featureCard}`}
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.featureIcon}>
                  <f.icon size={32} color="var(--color-primary)" />
                </div>
                <h3 className="text-h3">{t(f.titleKey)}</h3>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className={styles.section} style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className="text-h2">{t("landing.how.title")}</h2>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              
            </p>
          </div>
          <div className={styles.steps}>
            {STEPS.map((s, i) => (
              <div key={i} className={styles.step}>
                <div className={styles.stepNumber}>{i + 1}</div>
                <h3 className="text-h3">{t(s.titleKey)}</h3>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{t(s.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Institution Partners ── */}
      <section id="banks" className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className="text-h2">{t("landing.partners.title")}</h2>
            <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
              
            </p>
          </div>
          <div className={styles.banks}>
            {BANKS.map((b, i) => (
              <div key={i} className={`card ${styles.bankCard}`}>
                <div className={styles.bankLogoWrapper}>
                  {b.logo ? (
                    <img src={b.logo} alt={b.name} className={styles.bankLogo} />
                  ) : (
                    <div className={styles.bankEmoji}>
                      <Building2 size={32} color="var(--color-primary)" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-h3">{b.name}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t(b.taglineKey)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className={styles.ctaBanner}>
        <div className="container">
          <div className={styles.ctaContent}>
            <h2 className="text-h2">{t("landing.cta.title")}</h2>
            <p style={{ color: "var(--color-text-secondary)" }}>
              {t("landing.cta.subtitle")}
            </p>
            <Link href="/user/register" className="btn btn-primary btn-lg">
              {t("landing.cta.button")} <ArrowRight size={20} style={{ marginLeft: 8 }} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerInner}>
            <div className={styles.logo}>
              <Hexagon size={24} className={styles.logoIcon} />
              <span>DLEM</span>
            </div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              © 2026 Smart Loans, Trusted Advisor | Malawi
              {" "}{t("landing.footer")}
            </p>
            
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  { icon: Zap, titleKey: "landing.feature.instantTitle", descKey: "landing.feature.instantDesc" },
  { icon: Globe, titleKey: "landing.feature.applyTitle", descKey: "landing.feature.applyDesc" },
  { icon: Calculator, titleKey: "landing.feature.simulatorTitle", descKey: "landing.feature.simulatorDesc" },
  { icon: Clock, titleKey: "landing.feature.statusTitle", descKey: "landing.feature.statusDesc" },
  { icon: LayoutDashboard, titleKey: "landing.feature.dashboardTitle", descKey: "landing.feature.dashboardDesc" },
  { icon: ShieldCheck, titleKey: "landing.feature.secureTitle", descKey: "landing.feature.secureDesc" },
];

const HIDDEN_FEATURES = new Set([
  "landing.feature.applyTitle",
  "landing.feature.simulatorTitle",
  "landing.feature.statusTitle",
]);

const STEPS = [
  { titleKey: "landing.step.accountTitle", descKey: "landing.step.accountDesc" },
  { titleKey: "landing.step.profileTitle", descKey: "landing.step.profileDesc" },
  { titleKey: "landing.step.checkTitle", descKey: "landing.step.checkDesc" },
  { titleKey: "landing.step.trackTitle", descKey: "landing.step.trackDesc" },
];

const BANKS = [
  { logo: "/logos/fdh.png", name: "FDH Bank", taglineKey: "landing.partner.fdh" },
  { logo: "/logos/sacco.png", name: "Malawi Police SACCO", taglineKey: "landing.partner.sacco" },
  { logo: "/logos/finca.png", name: "FINCA Malawi", taglineKey: "landing.partner.finca" },
];
