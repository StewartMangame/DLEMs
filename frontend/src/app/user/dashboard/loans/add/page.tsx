"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function AddLoanPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    institutionId: "",
    customProviderName: "",
    loanAmount: "",
    interestRate: "",
    loanTermMonths: "",
    startDate: new Date().toISOString().split("T")[0],
    loanPurpose: "",
  });

  useEffect(() => {
    // Fetch institutions from the new public endpoint
    fetch("/api/eligibility/institutions")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setInstitutions(data);
        else if (data.institutions) setInstitutions(data.institutions);
      })
      .catch((err) => console.error(t("addLoan.fetchError"), err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload: any = {
        loanAmount: parseFloat(formData.loanAmount),
        interestRate: parseFloat(formData.interestRate || "0"),
        loanTermMonths: parseInt(formData.loanTermMonths),
        startDate: new Date(formData.startDate).toISOString(),
        loanPurpose: formData.loanPurpose,
      };

      if (formData.institutionId === "other" || !formData.institutionId) {
        payload.providerName = formData.customProviderName || t("addLoan.unknownLender");
      } else {
        payload.institutionId = parseInt(formData.institutionId);
      }

      const res = await fetch("/api/loans/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("addLoan.failed"));
      }

      router.push("/user/dashboard/loans");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/user/dashboard/loans" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "8px", alignSelf: "flex-start" }}>
          <ArrowLeft size={16} /> {t("common.back")}
        </Link>
        <h1 className="text-h2">{t("addLoan.title")}</h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {t("addLoan.subtitle")}
        </p>
      </div>

      <div className={`card ${styles.formCard}`}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t("addLoan.institution")}</label>
              <select
                required
                className="form-select"
                value={formData.institutionId}
                onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
              >
                <option value="">{t("addLoan.selectInstitution")}</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
                <option value="other">{t("addLoan.other")}</option>
              </select>
            </div>
            
            {formData.institutionId === "other" && (
              <div className="form-group animate-fadeInUp">
                <label className="form-label">{t("addLoan.lenderName")}</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder={t("addLoan.lenderPlaceholder")}
                  value={formData.customProviderName}
                  onChange={(e) => setFormData({ ...formData, customProviderName: e.target.value })}
                />
              </div>
            )}
            
            {formData.institutionId !== "other" && <div className="form-group" />}
          </div>

          <div className="form-group">
            <label className="form-label">{t("addLoan.purpose")}</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder={t("addLoan.purposePlaceholder")}
              value={formData.loanPurpose}
              onChange={(e) => setFormData({ ...formData, loanPurpose: e.target.value })}
            />
            <div className="form-help">{t("addLoan.purposeHelp")}</div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t("addLoan.principal")}</label>
              <input
                type="number"
                required
                className="form-input"
                placeholder="e.g. 1500000"
                value={formData.loanAmount}
                onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
              />
              <div className="form-help">{t("addLoan.principalHelp")}</div>
            </div>
            <div className="form-group">
              <label className="form-label">{t("addLoan.interest")}</label>
              <input
                type="number"
                step="0.01"
                required
                className="form-input"
                placeholder="e.g. 24.5"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
              />
              <div className="form-help">{t("addLoan.interestHelp")}</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t("addLoan.term")}</label>
              <input
                type="number"
                required
                className="form-input"
                placeholder="e.g. 36"
                value={formData.loanTermMonths}
                onChange={(e) => setFormData({ ...formData, loanTermMonths: e.target.value })}
              />
              <div className="form-help">{t("addLoan.termHelp")}</div>
            </div>
            <div className="form-group">
              <label className="form-label">{t("addLoan.startDate")}</label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <div className="form-help">{t("addLoan.startDateHelp")}</div>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? t("addLoan.recording") : t("addLoan.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
