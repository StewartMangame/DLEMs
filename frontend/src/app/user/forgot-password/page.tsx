"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "../auth.module.css";
import { Hexagon, ArrowLeft, Mail } from "lucide-react";
import PreferenceControls from "@/components/PreferenceControls";
import { useLanguage } from "@/lib/LanguageContext";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || t("forgot.failed"));
        return;
      }
      setMessage(data.message || t("forgot.success"));
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
        <div className={styles.authTopbar}>
          <Link href="/user/login" className="btn btn-ghost btn-sm" style={{ gap: '8px' }}>
            <ArrowLeft size={16} /> {t("auth.back")}
          </Link>
          <Link href="/" className={styles.logo}>
            <Hexagon size={24} className={styles.logoIcon} /> DLEM
          </Link>
          <PreferenceControls />
        </div>
        <div className={`card ${styles.card} ${styles.cardNarrow}`}>
          <div className={styles.cardHeader}>
            <h1 className="text-h2">{t("forgot.title")}</h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {t("forgot.subtitle")}
            </p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          {!message && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">{t("auth.email")}</label>
                <input id="email" name="email" type="email" required className="form-input"
                  placeholder={t("auth.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", marginTop: 4 }}>
                {loading ? <><span className="loading-spinner" /> {t("forgot.sending")}</> : <><Mail size={20} style={{ marginRight: 8 }} /> {t("forgot.sendLink")}</>}
              </button>
            </form>
          )}

          <p className={styles.switchLink}>
            {t("forgot.remembered")}{" "}
            <Link href="/user/login">{t("auth.back")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
