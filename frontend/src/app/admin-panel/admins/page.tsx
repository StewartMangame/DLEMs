"use client";
import { useState, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { ModalCloseButton } from "../icons";
import styles from "../institutions/institutions.module.css";

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin-panel/admins")
      .then(r => { if (!r.ok) throw new Error("Forbidden"); return r.json(); })
      .then(setAdmins)
      .catch(e => setError(e.message === "Forbidden" ? "This section is restricted to Super Admins only." : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus(id: number, isActive: boolean) {
    await fetch(`/api/admin-panel/admins/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    load();
  }

  async function changeRole(id: number, role: string) {
    await fetch(`/api/admin-panel/admins/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    load();
  }

  if (error) return (
    <div>
      <h1 className={styles.pageTitle}>Admin Account Management</h1>
      <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", padding: "1.25rem", color: "#fca5a5", marginTop: "1rem" }}>{error}</div>
    </div>
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin Account Management</h1>
          <p className={styles.pageSub}>Super Admin access only · {admins.length} admin accounts</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)}>+ Add Admin</button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.loadingCell}>Loading…</td></tr>
            ) : admins.map((a: any) => (
              <tr key={a.id}>
                <td className={styles.instName}>{a.fullName}</td>
                <td style={{ fontSize: "0.85rem", color: "var(--ap-text-secondary)" }}>{a.email}</td>
                <td>
                  <span style={{
                    display: "inline-block", fontSize: "0.7rem", fontWeight: 700,
                    padding: "3px 10px", borderRadius: "20px", textTransform: "uppercase",
                    background: a.role === "super_admin" ? "rgba(124,58,237,0.2)" : "rgba(56,189,248,0.15)",
                    color: a.role === "super_admin" ? "var(--ap-accent-light)" : "var(--ap-info)",
                  }}>
                    {a.role === "super_admin" ? "Super Admin" : "Content Admin"}
                  </span>
                </td>
                <td>
                  <span className={styles.statusDot} style={{ background: a.isActive ? "var(--ap-success)" : "var(--ap-danger)" }} />
                  <span style={{ color: a.isActive ? "var(--ap-success)" : "var(--ap-danger)", fontSize: "0.85rem", fontWeight: 600 }}>
                    {a.isActive ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className={styles.dateCell}>{a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : "Never"}</td>
                <td>
                  <div className={styles.actionRow}>
                    <select
                      className={styles.select}
                      style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                      value={a.role}
                      onChange={e => changeRole(a.id, e.target.value)}
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="content_admin">Content Admin</option>
                    </select>
                    {a.isActive
                      ? <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => toggleStatus(a.id, false)}>Deactivate</button>
                      : <button className={`${styles.actionBtn} ${styles.success}`} onClick={() => toggleStatus(a.id, true)}>Activate</button>
                    }
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && <AddAdminModal onClose={() => setShowAdd(false)} onSaved={load} />}
    </div>
  );
}

function AddAdminModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ fullName: "", email: "", role: "content_admin", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.fullName || !form.email || !form.password) { setError("All fields are required"); return; }
    setSaving(true);
    const res = await fetch("/api/admin-panel/admins", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.message || "Error"); }
    else { onSaved(); onClose(); }
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Add Admin Account</h2>
          <ModalCloseButton className={styles.modalClose} onClose={onClose} />
        </div>
        <div className={styles.modalBody}>
          {error && <div className={styles.formError}>{error}</div>}
          <div className={styles.formSection}>
            <h3>Account Details</h3>
            <div className={styles.formGrid}>
              <label>Full Name *<input value={form.fullName} onChange={e => set("fullName", e.target.value)} /></label>
              <label>Email Address *<input type="email" value={form.email} onChange={e => set("email", e.target.value)} /></label>
              <label>Role<select value={form.role} onChange={e => set("role", e.target.value)}>
                <option value="content_admin">Content Admin</option>
                <option value="super_admin">Super Admin</option>
              </select></label>
              <label>Temporary Password *<input type="password" value={form.password} onChange={e => set("password", e.target.value)} /></label>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.8rem", color: "#fcd34d", marginTop: "0.5rem" }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden />
              <span>The admin will be prompted to change their password on first login.</span>
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>{saving ? "Creating…" : "Create Admin Account"}</button>
        </div>
      </div>
    </div>
  );
}
