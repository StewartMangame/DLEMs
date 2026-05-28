"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import { Hexagon, ArrowLeft, LogIn } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      const data = await readJson(res);
      if (!res.ok) {
        setError(t("auth.invalidLogin"));
        return;
      }
      if (data.role === "super_admin" || data.role === "content_admin") {
        router.push("/admin-panel/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    } catch {
      setError(t("auth.networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />
      <div className={styles.container}>
        <div className={styles.authBackRow}>
          <Link href="/" className={styles.authBackButton} aria-label={t("auth.back")}>
            <ArrowLeft size={20} aria-hidden />
          </Link>
        </div>
        <div className={styles.authLogoRow}>
          <Link href="/" className={styles.logo}>
            <Hexagon size={28} className={styles.logoIcon} />
            <span>DLEM</span>
          </Link>
        </div>
        <div className={`card ${styles.card} ${styles.cardNarrow}`}>
          <div className={styles.cardHeader}>
            <h1 className="text-h2">{t("auth.loginTitle")}</h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {t("auth.loginSubtitle")}
            </p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">{t("auth.email")}</label>
              <input id="email" name="email" type="email" required className="form-input"
                placeholder="youremail@gmail.com" value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">{t("auth.password")}</label>
              <input id="password" name="password" type="password" required className="form-input"
                placeholder={t("auth.passwordPlaceholder")} value={form.password} onChange={handleChange} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <Link href="/user/forgot-password" className="text-sm" style={{ color: "var(--color-primary)" }}>
                  {t("auth.forgotPassword")}
                </Link>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", marginTop: 4 }}>
              {loading ? <><span className="loading-spinner" /> {t("auth.signingIn")}</> : <><LogIn size={20} style={{ marginRight: 8 }} /> {t("auth.signIn")}</>}
            </button>
          </form>

          <p className={styles.switchLink}>
            {t("auth.newCustomer")}{" "}
            <Link href="/user/register">{t("auth.createAccount")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

async function readJson(res: Response) {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

