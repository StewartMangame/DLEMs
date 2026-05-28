"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { Save, ArrowLeft, ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface Profile {
  bank: string;
  employer: string;
  employmentCategory: string;
  monthlySalary: number;
  employmentYears: number;   // stored as months despite the field name (backend column name)
  age: number;
  housingStatus: string;
  existingLoanAmount: number;
  bankingYears: number;
  dependants: number;
}

interface Institution {
  id: number;
  name: string;
  type: string;
}

interface SelectOption {
  value: string;
  label: string;
}

function ProfileSelect({
  id,
  name,
  value,
  options,
  onChange,
  required = false,
}: {
  id: string;
  name: keyof Profile;
  value: string;
  options: SelectOption[];
  onChange: (name: keyof Profile, value: string) => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideTap = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideTap);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideTap);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className={styles.selectWrap} ref={menuRef}>
      <input
        type="hidden"
        name={name}
        value={value}
        required={required}
      />
      <button
        id={id}
        type="button"
        className={styles.selectButton}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label}</span>
        <ChevronDown size={18} className={styles.selectChevron} aria-hidden />
      </button>
      {open && (
        <div className={styles.selectMenu} role="listbox" aria-labelledby={id}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={styles.selectOption}
              onClick={() => {
                onChange(name, option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const [form, setForm] = useState<Profile>({
    bank: "", employer: "", employmentCategory: "", monthlySalary: 0,
    employmentYears: 0, age: 0, housingStatus: "", existingLoanAmount: 0, bankingYears: 0,
    dependants: 0,
  });
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadedProfile, setLoadedProfile] = useState(false);

  useEffect(() => {
    // Fetch user profile
    fetch("/api/profile").then(r => r.json()).then(data => {
      if (data.profile) {
        setForm({
          ...data.profile,
          bank: data.profile.bank || "",
          employmentCategory: data.profile.employmentCategory || ""
        });
      }
      setLoadedProfile(true);
    });

    // Fetch institutions for the dropdown
    fetch("/api/eligibility/institutions").then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setInstitutions(data);
      }
    }).catch(err => console.error("Could not load institutions", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSelectChange = (name: keyof Profile, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg(null);
    const res = await fetch("/api/profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) setMsg({ type: "success", text: t("profile.saved") });
    else setMsg({ type: "error", text: data.message || data.error || t("profile.saveFailed") });
    setSaving(false);
  };


  if (!loadedProfile) return <div style={{ padding: 40, color: "var(--color-text-muted)" }}>{t("common.loading")}</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-md)', marginBottom: '2rem' }}>
        <Link href="/user/dashboard" className="btn btn-ghost btn-sm" style={{ gap: '8px' }}>
          <ArrowLeft size={16} /> {t("common.back")}
        </Link>
        <div>
          <h1 className="text-h2">{t("profile.title")}</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {t("profile.subtitle")}
          </p>
        </div>
      </div>



      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={`card ${styles.section}`}>
          <h2 className="text-h3">{t("profile.employmentDetails")}</h2>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="employer">{t("profile.employer")}</label>
              <input id="employer" name="employer" required className="form-input"
                placeholder={t("profile.employerPlaceholder")} value={form.employer || ""} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="employmentCategory">{t("profile.employmentCategory")}</label>
              <ProfileSelect
                id="employmentCategory"
                name="employmentCategory"
                required
                value={form.employmentCategory || ""}
                onChange={handleSelectChange}
                options={[
                  { value: "", label: t("profile.selectCategory") },
                  { value: "civil_servant", label: t("profile.civilServant") },
                  { value: "private_sector", label: t("profile.privateSector") },
                  { value: "self_employed", label: t("profile.selfEmployed") },
                ]}
              />
              <div className="form-help">{t("profile.categoryHelp")}</div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="monthlySalary">{t("profile.netSalary")}</label>
              <input id="monthlySalary" name="monthlySalary" type="number" required min={0} className="form-input"
                placeholder="e.g. 250000" value={form.monthlySalary || ""} onChange={handleChange} />
              <div className="form-help">{t("profile.salaryHelp")}</div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="employmentYears">
                {t("profile.serviceLength")}
                <span style={{ fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 6 }}>{t("profile.monthsLabel")}</span>
              </label>
              <input id="employmentYears" name="employmentYears" type="number" min={0} step={1} required className="form-input"
                placeholder="e.g. 36" value={form.employmentYears || ""} onChange={handleChange} />
              <div className="form-help">
                {t("profile.serviceHelp")}
              </div>
            </div>
          </div>
        </div>

        <div className={`card ${styles.section}`}>
          <h2 className="text-h3">{t("profile.personalFinancial")}</h2>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="bank">{t("profile.primaryBank")}</label>
              <ProfileSelect
                id="bank"
                name="bank"
                value={form.bank || ""}
                onChange={handleSelectChange}
                options={[
                  { value: "", label: t("profile.unbanked") },
                  ...institutions.map(inst => ({ value: inst.name, label: inst.name })),
                ]}
              />
              <div className="form-help">{t("profile.bankHelp")}</div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="age">{t("profile.age")}</label>
              <input id="age" name="age" type="number" min={18} max={70} required className="form-input"
                placeholder="e.g. 35" value={form.age || ""} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="housingStatus">{t("profile.housingStatus")}</label>
              <ProfileSelect
                id="housingStatus"
                name="housingStatus"
                required
                value={form.housingStatus || ""}
                onChange={handleSelectChange}
                options={[
                  { value: "", label: t("profile.selectStatus") },
                  { value: "owner", label: t("profile.owner") },
                  { value: "tenant", label: t("profile.tenant") },
                  { value: "family", label: t("profile.family") },
                ]}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="existingLoanAmount">{t("profile.existingRepayments")}</label>
              <input id="existingLoanAmount" name="existingLoanAmount" type="number" min={0} className="form-input"
                placeholder="0 if none" value={form.existingLoanAmount || ""} onChange={handleChange} />
              <div className="form-help">{t("profile.existingHelp")}</div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="dependants">{t("profile.dependants")}</label>
              <input id="dependants" name="dependants" type="number" min={0} max={20} className="form-input"
                placeholder="e.g. 3" value={form.dependants || ""} onChange={handleChange} />
              <div className="form-help">{t("profile.dependantsHelp")}</div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="bankingYears">{t("profile.bankingYears")}</label>
              <input id="bankingYears" name="bankingYears" type="number" min={0} step={0.5} className="form-input"
                placeholder="e.g. 2" value={form.bankingYears || ""} onChange={handleChange} />
            </div>
          </div>
        </div>


        {msg && (
          <div className={`alert alert-${msg.type === "success" ? "success" : "danger"}`} style={{ width: '100%', marginBottom: '16px' }}>
            {msg.text}
          </div>
        )}

        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {saving ? <><span className="loading-spinner" /> {t("profile.saving")}</> : <><Save size={20} /> {t("profile.saveProfile")}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

