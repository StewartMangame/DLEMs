"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { Save, ArrowLeft } from "lucide-react";

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

export default function ProfilePage() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg(null);
    const res = await fetch("/api/profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) setMsg({ type: "success", text: "Profile saved successfully!" });
    else setMsg({ type: "error", text: data.message || data.error || "Save failed." });
    setSaving(false);
  };


  if (!loadedProfile) return <div style={{ padding: 40, color: "var(--color-text-muted)" }}>Loading...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-h2">Financial Profile</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            This information is used to calculate your loan eligibility and risk score across Malawian lenders.
          </p>
        </div>
        <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ gap: '8px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>



      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={`card ${styles.section}`}>
          <h2 className="text-h3">Employment Details</h2>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="employer">Employer / Organization</label>
              <input id="employer" name="employer" required className="form-input"
                placeholder="e.g. Ministry of Health, Airtel, etc." value={form.employer || ""} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="employmentCategory">Employment Category</label>
              <select id="employmentCategory" name="employmentCategory" required className="form-select"
                value={form.employmentCategory || ""} onChange={handleChange}>
                <option value="">Select Category</option>
                <option value="civil_servant">Civil Servant (Government)</option>
                <option value="private_sector">Private Sector</option>
                <option value="self_employed">Self-Employed / Business owner</option>
                <option value="sacco_member">SACCO Member</option>
              </select>
              <div className="form-help">This determines which lenders and multipliers you are eligible for.</div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="monthlySalary">Net Monthly Salary (MK)</label>
              <input id="monthlySalary" name="monthlySalary" type="number" required min={0} className="form-input"
                placeholder="e.g. 250000" value={form.monthlySalary || ""} onChange={handleChange} />
              <div className="form-help">Enter your monthly take-home pay in Malawian Kwacha (after all standard tax deductions).</div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="employmentYears">
                Length of Service / Time in Business
                <span style={{ fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 6 }}>(months)</span>
              </label>
              <input id="employmentYears" name="employmentYears" type="number" min={0} step={1} required className="form-input"
                placeholder="e.g. 36" value={form.employmentYears || ""} onChange={handleChange} />
              <div className="form-help">
                Enter the total number of months you have been employed or in business.
                Used by SACCO and other lenders to verify minimum service requirements.
              </div>
            </div>
          </div>
        </div>

        <div className={`card ${styles.section}`}>
          <h2 className="text-h3">Personal & Financial Details</h2>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="bank">Primary Salary Bank</label>
              <select id="bank" name="bank" className="form-select"
                value={form.bank || ""} onChange={handleChange}>
                <option value="">Unbanked / Other</option>
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.name}>{inst.name}</option>
                ))}
              </select>
              <div className="form-help">Where your salary is deposited. Leave blank if unbanked.</div>
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
                <option value="">Select status</option>
                <option value="owner">Property Owner</option>
                <option value="tenant">Tenant / Renting</option>
                <option value="family">Living with Family</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="existingLoanAmount">Monthly Existing Loan Repayments (MK)</label>
              <input id="existingLoanAmount" name="existingLoanAmount" type="number" min={0} className="form-input"
                placeholder="0 if none" value={form.existingLoanAmount || ""} onChange={handleChange} />
              <div className="form-help">Total monthly repayments on all current loans. Affects your DTI ratio.</div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="dependants">Number of Dependants</label>
              <input id="dependants" name="dependants" type="number" min={0} max={20} className="form-input"
                placeholder="e.g. 3" value={form.dependants || ""} onChange={handleChange} />
              <div className="form-help">Total number of people financially dependent on you (children, spouse, parents, etc.).</div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="bankingYears">Years with Current Bank</label>
              <input id="bankingYears" name="bankingYears" type="number" min={0} step={0.5} className="form-input"
                placeholder="e.g. 2" value={form.bankingYears || ""} onChange={handleChange} />
            </div>
          </div>
        </div>


        <div className={styles.formActions}>
          {msg && (
            <div className={`alert alert-${msg.type === "success" ? "success" : "danger"}`} style={{ width: '100%', marginBottom: '16px' }}>
              {msg.text}
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {saving ? <><span className="loading-spinner" /> Saving...</> : <><Save size={20} /> Save Profile</>}
          </button>
        </div>
      </form>
    </div>
  );
}

