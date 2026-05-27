import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
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
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
            <a href="#banks">Partners</a>
          </div>
          <div className={styles.navCta}>
            <Link href="/user/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link href="/user/register" className="btn btn-primary btn-sm">Get Started</Link>
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
            Your Loan <span className="text-gradient">Eligibility</span>.<br />
            Instant. Digital. <span className="text-gradient">Transparent</span>.
          </h1>
          <p className={`text-body ${styles.heroSub} animate-fadeInUp animate-delay-2`}>
            Check if you qualify for a personal loan in minutes — without visiting a branch.
            Apply online, track repayments, and get real-time decisions from FDH Bank,
            Malawi Police SACCO, and FINCA Malawi.
          </p>
          <div className={`${styles.heroActions} animate-fadeInUp animate-delay-3`}>
            <Link href="/user/register" className="btn btn-primary btn-lg">
              Check My Eligibility <ArrowRight size={20} style={{ marginLeft: 8 }} />
            </Link>
            <Link href="/user/login" className="btn btn-outline btn-lg">
              Sign In to Dashboard
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
              <span className={styles.heroStatValue}>3 Institutions</span>
              <span className={styles.heroStatLabel}>Supported</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>&lt; 5 min</span>
              <span className={styles.heroStatLabel}>Eligibility Check</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>100%</span>
              <span className={styles.heroStatLabel}>Digital Process</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className="text-h2">Everything You Need, Digitally</h2>
            <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
              No queues. No paperwork. No branch visits required.
            </p>
          </div>
          <div className={`grid-3 ${styles.featuresGrid}`}>
            {FEATURES.map((f, i) => (
              <div key={i} className={`card card-hover ${styles.featureCard}`}
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.featureIcon}>
                  <f.icon size={32} color="var(--color-primary)" />
                </div>
                <h3 className="text-h3">{f.title}</h3>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className={styles.section} style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className="text-h2">How It Works</h2>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Four simple steps from eligibility to approval
            </p>
          </div>
          <div className={styles.steps}>
            {STEPS.map((s, i) => (
              <div key={i} className={styles.step}>
                <div className={styles.stepNumber}>{i + 1}</div>
                <h3 className="text-h3">{s.title}</h3>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Institution Partners ── */}
      <section id="banks" className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className="text-h2">Our Institution Partners</h2>
            <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
              Trusted Malawian lenders — one eligibility check covers all of them.
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
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{b.tagline}</div>
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
            <h2 className="text-h2">Ready to Apply?</h2>
            <p style={{ color: "var(--color-text-secondary)" }}>
              Join thousands of Malawians easing their banking experience digitally.
            </p>
            <Link href="/user/register" className="btn btn-primary btn-lg">
              Create Free Account <ArrowRight size={20} style={{ marginLeft: 8 }} />
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
              © 2026 Digital Loan Eligibility & Management System | Malawi
              Your trusted partner in financial inclusion
            </p>
            
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  { icon: Zap, title: "Instant Eligibility Check", desc: "Get an automated risk score and eligibility verdict in under 2 minutes based on your financial profile." },
  { icon: Globe, title: "Apply From Anywhere", desc: "Submit your personal loan application from your phone or computer — no branch visit required." },
  { icon: Calculator, title: "Loan Repayment Simulator", desc: "Calculate your monthly installments, total cost, and full amortization schedule before you commit." },
  { icon: Clock, title: "Real-Time Status Tracking", desc: "Track your application status from submission through credit officer review to final decision." },
  { icon: LayoutDashboard, title: "Active Loan Dashboard", desc: "Monitor outstanding balance, paid months, and upcoming payments from your personal dashboard." },
  { icon: ShieldCheck, title: "Secure & Private", desc: "Your financial data is encrypted and protected. Only you and your bank officer can access your profile." },
];

const STEPS = [
  { title: "Create Account", desc: "Register with your National ID, phone number, and select your bank in under 2 minutes." },
  { title: "Set Financial Profile", desc: "Enter your employment details, monthly salary, housing, and existing loan obligations." },
  { title: "Check Eligibility", desc: "Our engine runs automated risk scoring using real banking criteria and gives you instant feedback." },
  { title: "Apply & Track", desc: "Submit your formal application and track status as your credit officer reviews and approves it." },
];

const BANKS = [
  { logo: "/logos/fdh.png", name: "FDH Bank", tagline: "Personal & salary loans · civil servants & private sector" },
  { logo: "/logos/sacco.png", name: "Malawi Police SACCO", tagline: "Member loans · competitive rates · Malawi Police SACCO" },
  { logo: "/logos/finca.png", name: "FINCA Malawi", tagline: "Group / Village Bank loans · business owners" },
];
