"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import { Hexagon, Eye, EyeOff, Mail, ArrowLeft, User, IdCard, Badge, Phone } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

// ─── Helpers 
function isValidEmail(email: string): boolean {
  // RFC-compliant basic check: local@domain.tld
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

// ─── Types 
type Step = "details" | "otp";

interface FormData {
  fullName: string;
  nationalId: string;
  employeeNumber: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ─── Component 
export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();

  // Step tracking
  const [step, setStep] = useState<Step>("details");

  // Form state (Step 1)
  const [form, setForm] = useState<FormData>({
    fullName: "", nationalId: "", employeeNumber: "",
    phone: "", email: "", password: "", confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  // OTP state (Step 2)
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState("");

  // Shared
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Field change 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ── Client-side validation 
  const emailValid = isValidEmail(form.email);
  const passwordsMatch = form.password === form.confirmPassword;
  const passwordLongEnough = form.password.length >= 8;
  const canSubmitDetails =
    form.fullName.trim() &&
    form.nationalId.trim() &&
    form.employeeNumber.trim() &&
    form.phone.trim() &&
    emailValid &&
    passwordLongEnough &&
    passwordsMatch;

  // ── Step 1 Submit — send registration + trigger OTP email 
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!emailValid) { setError(t("auth.invalidEmail")); return; }
    if (!passwordLongEnough) { setError(t("auth.passwordTooShort")); return; }
    if (!passwordsMatch) { setError(t("auth.passwordMismatch")); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          nationalId: form.nationalId.trim(),
          employeeNumber: form.employeeNumber.trim(),
          phone: form.phone.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });
      const data = await readJson(res);

      if (!res.ok) {
        const msg: string = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || data.error || t("auth.registrationFailed");
        setError(msg);
        return;
      }

      if (data.requiresOtp) {
        setDevOtp(data.devOtp || "");
        setOtp(["", "", "", "", "", ""]);
        setOtpError("");
        setStep("otp");
        startResendCooldown();
        return;
      }

      router.push("/user/dashboard");
    } catch {
      setError(t("auth.registrationNetworkError"));
    } finally {
      setLoading(false);
    }
  };

  // ── OTP digit input handling 
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setOtpError("");
    // Auto-advance
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // ── Step 2 Submit — verify OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setOtpError(t("auth.enterAllDigits")); return; }

    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim().toLowerCase(), otp: code }),
      });
      const data = await readJson(res);

      if (!res.ok) {
        setOtpError(data.message || data.error || t("auth.invalidOtp"));
        return;
      }

      router.push("/user/dashboard");
    } catch {
      setOtpError(t("auth.verifyNetworkError"));
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Resend OTP 
  const startResendCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtpError("");
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim().toLowerCase() }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        setOtpError(data.message || data.error || t("auth.resendError"));
        return;
      }
      setDevOtp(data.devOtp || "");
      startResendCooldown();
    } catch {
      setOtpError(t("auth.resendError"));
    }
  };

  // ── Render 
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

        {/* ── STEP 1: Details ── */}
        {step === "details" && (
          <div className={`card ${styles.card}`}>
            <div className={styles.cardHeader}>
              <h1 className="text-h2">{t("auth.registerTitle")}</h1>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {t("auth.registerSubtitle")}
              </p>
              <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                <span style={stepDot(true)} />
              </div>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                <span>✗</span>
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleDetailsSubmit} className={styles.form} noValidate>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="fullName">{t("auth.fullName")}</label>
                  <div className={styles.inputWrapper}>
                    <User size={18} className={styles.fieldIcon} />
                    <input id="fullName" name="fullName" required className="form-input"
                      placeholder={t("auth.fullNamePlaceholder")} value={form.fullName} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="nationalId">{t("auth.nationalId")}</label>
                  <div className={styles.inputWrapper}>
                    <IdCard size={18} className={styles.fieldIcon} />
                    <input id="nationalId" name="nationalId" required className="form-input"
                      placeholder={t("auth.nationalIdPlaceholder")} value={form.nationalId} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="employeeNumber">{t("auth.employeeNumber")}</label>
                  <div className={styles.inputWrapper}>
                    <Badge size={18} className={styles.fieldIcon} />
                    <input id="employeeNumber" name="employeeNumber" required className="form-input"
                      placeholder={t("auth.employeeNumberPlaceholder")} value={form.employeeNumber} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">{t("auth.phone")}</label>
                  <div className={styles.inputWrapper}>
                    <Phone size={18} className={styles.fieldIcon} />
                    <input id="phone" name="phone" required className="form-input" type="tel"
                      placeholder={t("auth.phonePlaceholder")} value={form.phone} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Email with live validation */}
              <div className="form-group">
                <label className="form-label" htmlFor="email">{t("auth.email")}</label>
                <div className={styles.inputWrapper}>
                  <Mail size={18} className={styles.fieldIcon} />
                  <input
                    id="email" name="email" type="email" required className="form-input"
                    autoComplete="email"
                    placeholder={t("auth.emailRegisterPlaceholder")}
                    value={form.email}
                    onChange={handleChange}
                    onBlur={() => setEmailTouched(true)}
                    style={{
                      borderColor: emailTouched
                        ? emailValid ? "var(--color-success)" : "var(--color-danger)"
                        : undefined,
                    }}
                  />
                </div>
                {emailTouched && !emailValid && (
                  <div style={{ marginTop: 4, fontSize: "0.8rem", color: "var(--color-danger)" }}>
                    x {t("auth.invalidEmail")}
                  </div>
                )}
                {emailTouched && emailValid && (
                  <div style={{ marginTop: 4, fontSize: "0.8rem", color: "var(--color-success)" }}>
                    {t("auth.validEmail")}
                  </div>
                )}
                <div className="form-help">
                  {t("auth.emailHelp")}
                </div>
              </div>

              {/* Passwords */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="password">{t("auth.password")}</label>
                  <div style={{ position: "relative" }}>
                    <input id="password" name="password" type={showPw ? "text" : "password"}
                      required className="form-input" autoComplete="new-password"
                      placeholder={t("auth.passwordMin")} value={form.password} onChange={handleChange}
                      style={{ paddingRight: "3rem" }}
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      style={{
                        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--color-text-muted)", fontSize: "1rem", padding: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                      aria-label={showPw ? t("auth.hidePassword") : t("auth.showPassword")}
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {form.password.length > 0 && form.password.length < 8 && (
                    <div style={{ marginTop: 4, fontSize: "0.8rem", color: "var(--color-danger)" }}>
                      x {t("auth.passwordTooShort")}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">{t("auth.confirmPassword")}</label>
                  <div style={{ position: "relative" }}>
                    <input id="confirmPassword" name="confirmPassword"
                      type={showPw ? "text" : "password"} required className="form-input"
                      autoComplete="new-password"
                      placeholder={t("auth.confirmPasswordPlaceholder")} value={form.confirmPassword} onChange={handleChange}
                      style={{ paddingRight: "3rem" }}
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      style={{
                        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--color-text-muted)", fontSize: "1rem", padding: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                      aria-label={showPw ? t("auth.hidePassword") : t("auth.showPassword")}
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {form.confirmPassword && !passwordsMatch && (
                    <div style={{ marginTop: 4, fontSize: "0.8rem", color: "var(--color-danger)" }}>
                      x {t("auth.passwordMismatch")}
                    </div>
                  )}
                  {form.confirmPassword && passwordsMatch && passwordLongEnough && (
                    <div style={{ marginTop: 4, fontSize: "0.8rem", color: "var(--color-success)" }}>
                      {t("auth.passwordsMatch")}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !canSubmitDetails}
                style={{ width: "100%", marginTop: 8 }}
              >
                {loading
                  ? <><span className="loading-spinner" /> {t("auth.creatingAccount")}</>
                  : t("auth.createAccountButton")}
              </button>
            </form>

            <p className={styles.switchLink}>
              {t("auth.alreadyHaveAccount")}{" "}
              <Link href="/user/login">{t("auth.signIn")}</Link>
            </p>
          </div>
        )}

        {/* ── STEP 2: OTP Verification ── */}
        {step === "otp" && (
          <div className={`card ${styles.card} ${styles.cardNarrow}`}>
            <div className={styles.cardHeader}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  background: 'var(--color-primary-glow)',
                  padding: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-primary)'
                }}>
                  <Mail size={40} color="var(--color-primary)" />
                </div>
              </div>
              <h1 className="text-h2">{t("auth.checkEmailTitle")}</h1>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {t("auth.checkEmailSubtitle")}
              </p>
              <p style={{ fontWeight: 600, fontSize: "0.95rem", marginTop: 4, color: "var(--color-primary)" }}>
                {form.email}
              </p>
              {/* Step indicator */}
              <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                <span style={stepDot(true)} />
                <span style={stepDot(true)} />
              </div>
            </div>

            {otpError && (
              <div className="alert alert-danger" role="alert">
                <span>✗</span>
                <div>{otpError}</div>
              </div>
            )}

            {devOtp && (
              <div className="alert alert-info" role="status">
                <span>i</span>
                <div>{t("auth.developmentCode")}: <strong>{devOtp}</strong></div>
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className={styles.form} noValidate>
              {/* 6-digit OTP boxes */}
              <div style={{
                display: "flex", gap: "10px", justifyContent: "center",
                marginBottom: "var(--space-lg)",
              }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    style={{
                      width: 48, height: 56,
                      textAlign: "center",
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      borderRadius: "var(--radius-md)",
                      border: `2px solid ${digit ? "var(--color-primary)" : "var(--color-border)"}`,
                      background: "var(--color-surface)",
                      color: "var(--color-text-primary)",
                      outline: "none",
                      transition: "border-color 0.15s",
                    }}
                    aria-label={`OTP ${i + 1}`}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={otpLoading || otp.join("").length < 6}
                style={{ width: "100%", marginBottom: "var(--space-md)" }}
              >
                {otpLoading
                  ? <><span className="loading-spinner" /> {t("auth.verifying")}</>
                  : t("auth.verifyCreate")}
              </button>
            </form>

            <div style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
              {t("auth.didNotReceive")}{" "}
              {resendCooldown > 0 ? (
                <span>{t("auth.resendIn", { seconds: resendCooldown })}</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--color-primary)", fontWeight: 600, fontSize: "inherit", padding: 0,
                  }}
                >
                  {t("auth.resendCode")}
                </button>
              )}
            </div>

            <div style={{ marginTop: "var(--space-md)", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => { setStep("details"); setOtp(["", "", "", "", "", ""]); setOtpError(""); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--color-text-muted)", fontSize: "0.85rem",
                  display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', width: '100%'
                }}
              >
                <ArrowLeft size={14} /> {t("auth.back")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tiny helper: step progress dot 
function stepDot(active: boolean): React.CSSProperties {
  return {
    width: active ? 24 : 8,
    height: 8,
    borderRadius: 4,
    background: active ? "var(--color-primary)" : "var(--color-border)",
    transition: "all 0.3s",
    display: "inline-block",
  };
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
