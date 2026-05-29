"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../auth.module.css";
import { Hexagon, ArrowLeft, KeyRound } from "lucide-react";
import PreferenceControls from "@/components/PreferenceControls";
import { useLanguage } from "@/lib/LanguageContext";

function ResetPasswordForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError(t("reset.invalidToken"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || t("reset.failed"));
        return;
      }
      setMessage(t("reset.success"));
      setTimeout(() => {
        router.push("/user/login");
      }, 2000);
    } catch {
      setError(t("auth.networkError"));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="alert alert-danger">
        {t("reset.invalidTokenHelp")}
      </div>
    );
  }

  return (
    <>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {!message && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="password">{t("reset.newPassword")}</label>
            <input id="password" name="password" type="password" required className="form-input"
              placeholder={t("reset.newPasswordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">{t("auth.confirmPassword")}</label>
            <input id="confirmPassword" name="confirmPassword" type="password" required className="form-input"
              placeholder={t("reset.confirmPlaceholder")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", marginTop: 4 }}>
            {loading ? <><span className="loading-spinner" /> {t("reset.resetting")}</> : <><KeyRound size={20} style={{ marginRight: 8 }} /> {t("reset.submit")}</>}
          </button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  const { t } = useLanguage();

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
            <h1 className="text-h2">{t("reset.title")}</h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {t("reset.subtitle")}
            </p>
          </div>
          <Suspense fallback={<div>{t("common.loading")}</div>}>
            <ResetPasswordForm />
          </Suspense>
          <p className={styles.switchLink}>
            <Link href="/user/login">{t("auth.back")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

