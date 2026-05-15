"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "../institutions/institutions.module.css";

export default function SaccosPage() {
  const [saccos, setSaccos] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editSacco, setEditSacco] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/saccos")
      .then(r => r.json())
      .then(setSaccos)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deactivate(id: number) {
    if (!confirm("Deactivate this SACCO? It will be removed from the user-facing dropdown immediately.")) return;
    await fetch(`/api/admin/saccos/${id}`, { method: "DELETE" });
    load();
  }

  async function activate(id: number) {
    await fetch(`/api/admin/saccos/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "active" }) });
    load();
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>SACCO Management</h1>
          <p className={styles.pageSub}>{saccos.length} SACCOs · Active ones appear in the user-facing dropdown automatically</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)}>+ Add SACCO</button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>SACCO Name</th>
              <th>Min Income (MWK)</th>
              <th>Min Membership</th>
              <th>DTI Cap</th>
              <th>Interest Rate</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className={styles.loadingCell}>Loading…</td></tr>
            ) : saccos.length === 0 ? (
              <tr><td colSpan={7} className={styles.emptyCell}>No SACCOs in the system. Add one to populate the user-facing dropdown.</td></tr>
            ) : saccos.map((s: any) => (
              <tr key={s.id}>
                <td><div className={styles.instName}>{s.name}</div></td>
                <td>MWK {Number(s.minMonthlyIncome).toLocaleString()}</td>
                <td>{s.minMembershipMonths} months</td>
                <td>{(s.maxDtiRatio * 100).toFixed(0)}%</td>
                <td>{s.interestRate}% p.a.</td>
                <td>
                  <span className={styles.statusDot} style={{ background: s.status === "active" ? "var(--ap-success)" : "#475569" }} />
                  <span style={{ color: s.status === "active" ? "var(--ap-success)" : "#64748b", fontSize: "0.85rem", fontWeight: 600 }}>
                    {s.status === "active" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div className={styles.actionRow}>
                    <button className={styles.actionBtn} onClick={() => setEditSacco(s)}>Edit</button>
                    {s.status === "active"
                      ? <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => deactivate(s.id)}>Deactivate</button>
                      : <button className={`${styles.actionBtn} ${styles.success}`} onClick={() => activate(s.id)}>Activate</button>
                    }
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && <SaccoModal onClose={() => setShowAdd(false)} onSaved={load} />}
      {editSacco && <SaccoModal sacco={editSacco} onClose={() => setEditSacco(null)} onSaved={load} />}
    </div>
  );
}

function SaccoModal({ sacco, onClose, onSaved }: { sacco?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!sacco;
  const [form, setForm] = useState({
    name: sacco?.name || "",
    minMonthlyIncome: sacco?.minMonthlyIncome || 50000,
    minMembershipMonths: sacco?.minMembershipMonths || 12,
    minServiceMonths: sacco?.minServiceMonths || 6,
    maxDtiRatio: sacco?.maxDtiRatio || 0.40,
    repaymentMethod: sacco?.repaymentMethod || "Salary Deduction",
    loanProducts: sacco?.loanProducts || "Group or Individual",
    collateralAccepted: sacco?.collateralAccepted || false,
    turnaroundTime: sacco?.turnaroundTime || "7 working days",
    interestRate: sacco?.interestRate || 18,
    processingFeePercent: sacco?.processingFeePercent || 0,
    minRepaymentMonths: sacco?.minRepaymentMonths || 3,
    maxRepaymentMonths: sacco?.maxRepaymentMonths || 60,
    notes: sacco?.notes || "",
    status: sacco?.status || "active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name.trim()) { setError("SACCO name is required"); return; }
    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/saccos/${sacco.id}` : "/api/admin/saccos";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); setError(d.message || "Error"); }
      else { onSaved(); onClose(); }
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEdit ? `Edit: ${sacco.name}` : "Add New SACCO"}</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          {error && <div className={styles.formError}>{error}</div>}
          <div className={styles.formSection}>
            <h3>SACCO Details</h3>
            <div className={styles.formGrid}>
              <label>SACCO Name *<input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Malawi Police SACCO" /></label>
              <label>Status<select value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select></label>
              <label>Min Monthly Income (MWK)<input type="number" value={form.minMonthlyIncome} onChange={e => set("minMonthlyIncome", +e.target.value)} /></label>
              <label>Min Membership Period (months)<input type="number" value={form.minMembershipMonths} onChange={e => set("minMembershipMonths", +e.target.value)} /></label>
              <label>Min Service Period (months)<input type="number" value={form.minServiceMonths} onChange={e => set("minServiceMonths", +e.target.value)} /></label>
              <label>DTI Cap (e.g. 0.40)<input type="number" step="0.01" max="1" value={form.maxDtiRatio} onChange={e => set("maxDtiRatio", +e.target.value)} /></label>
              <label>Interest Rate (% p.a.)<input type="number" value={form.interestRate} onChange={e => set("interestRate", +e.target.value)} /></label>
              <label>Processing Fee (%)<input type="number" step="0.1" value={form.processingFeePercent} onChange={e => set("processingFeePercent", +e.target.value)} /></label>
              <label>Min Repayment (months)<input type="number" value={form.minRepaymentMonths} onChange={e => set("minRepaymentMonths", +e.target.value)} /></label>
              <label>Max Repayment (months)<input type="number" value={form.maxRepaymentMonths} onChange={e => set("maxRepaymentMonths", +e.target.value)} /></label>
              <label>Repayment Method<input value={form.repaymentMethod} onChange={e => set("repaymentMethod", e.target.value)} /></label>
              <label>Turnaround Time<input value={form.turnaroundTime} onChange={e => set("turnaroundTime", e.target.value)} /></label>
            </div>
            <label>Loan Products Description<input value={form.loanProducts} onChange={e => set("loanProducts", e.target.value)} /></label>
            <div className={styles.checkboxGrid} style={{ marginTop: "0.875rem" }}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={form.collateralAccepted} onChange={e => set("collateralAccepted", e.target.checked)} />
                Collateral accepted
              </label>
            </div>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.375rem", fontSize: "0.8rem", color: "var(--ap-text-secondary)", marginTop: "0.875rem" }}>
              Notes (shown to users)
              <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--ap-border)", borderRadius: "8px", padding: "0.625rem", color: "var(--ap-text)", width: "100%", outline: "none" }} />
            </label>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>{saving ? "Saving…" : isEdit ? "Save Changes" : "Add SACCO"}</button>
        </div>
      </div>
    </div>
  );
}
