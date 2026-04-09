"use client";
import { useState, useEffect } from "react";
import styles from "./page.module.css";

interface Profile {
  bank: string;
  employer: string;
  employmentType: string;
  monthlySalary: number;
  employmentYears: number;
  age: number;
  housingStatus: string;
  existingLoanAmount: number;
  bankingYears: number;
}

export default function ProfilePage() {
  const [form, setForm] = useState<Profile>({
    bank: "", employer: "", employmentType: "", monthlySalary: 0,
    employmentYears: 0, age: 0, housingStatus: "", existingLoanAmount: 0, bankingYears: 0,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(data => {
      if (data.profile) {
        setForm({
          ...data.profile,
          bank: data.bank || ""
        });
      }
      setLoaded(true);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg(null);
    const res = await fetch("/api/profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) setMsg({ type: "success", text: "Profile saved successfully!" });
    else setMsg({ type: "error", text: data.error || "Save failed." });
    setSaving(false);
  };


  if (!loaded) return <div style={{ padding: 40, color: "var(--color-text-muted)" }}>Loading…</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className="text-h2">Financial Profile</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            This information is used to calculate your loan eligibility and risk score
          </p>
        </div>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type === "success" ? "success" : "danger"}`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={`card ${styles.section}`}>
          <h2 className="text-h3">Employment Details</h2>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="employer">Employer / Organization</label>
              <input id="employer" name="employer" required className="form-input"
                placeholder="e.g. Ministry of Health" value={form.employer || ""} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="employmentType">Employment Type</label>
              <select id="employmentType" name="employmentType" required className="form-select"
                value={form.employmentType || ""} onChange={handleChange}>
                <option value="">— Select type —</option>
                <option value="civil_servant">Civil Servant (Government)</option>
                <option value="permanent_private">Permanent Private Sector</option>
                <option value="contract">Contract Employee</option>
                <option value="self_employed">Self-Employed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="monthlySalary">Gross Monthly Salary (MK)</label>
              <input id="monthlySalary" name="monthlySalary" type="number" required min={0} className="form-input"
                placeholder="e.g. 250000" value={form.monthlySalary || ""} onChange={handleChange} />
              <div className="form-help">Enter your monthly gross salary in Malawian Kwacha</div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="employmentYears">Years of Employment</label>
              <input id="employmentYears" name="employmentYears" type="number" min={0} step={0.5} required className="form-input"
                placeholder="e.g. 3.5" value={form.employmentYears || ""} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className={`card ${styles.section}`}>
          <h2 className="text-h3">Personal & Financial Details</h2>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="bank">Primary Bank</label>
              <select id="bank" name="bank" required className="form-select"
                value={form.bank || ""} onChange={handleChange}>
                <option value="">— Select bank —</option>
                <option value="Mwai Bank">Mwai Bank</option>
                <option value="Kokko Bank">Kokko Bank</option>
                <option value="KFS Bank">KFS Bank</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="age">Age</label>
              <input id="age" name="age" type="number" min={18} max={70} required className="form-input"
                placeholder="e.g. 35" value={form.age || ""} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="housingStatus">Housing Status</label>
              <select id="housingStatus" name="housingStatus" required className="form-select"
                value={form.housingStatus || ""} onChange={handleChange}>
                <option value="">— Select status —</option>
                <option value="owner">Property Owner</option>
                <option value="tenant">Tenant / Renting</option>
                <option value="family">Living with Family</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="existingLoanAmount">Monthly Existing Loan Repayments (MK)</label>
              <input id="existingLoanAmount" name="existingLoanAmount" type="number" min={0} className="form-input"
                placeholder="0 if none" value={form.existingLoanAmount || ""} onChange={handleChange} />
              <div className="form-help">Total monthly repayments on all current loans</div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="bankingYears">Years with Current Bank</label>
              <input id="bankingYears" name="bankingYears" type="number" min={0} step={0.5} className="form-input"
                placeholder="e.g. 2" value={form.bankingYears || ""} onChange={handleChange} />
            </div>
          </div>
        </div>


        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? <><span className="loading-spinner" /> Saving…</> : "Save Profile →"}
          </button>
        </div>
      </form>
    </div>
  );
}
