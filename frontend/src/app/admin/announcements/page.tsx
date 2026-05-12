"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "../institutions/institutions.module.css";

const STATUS_COLORS: Record<string, string> = {
  draft: "var(--ap-text-muted)",
  active: "var(--ap-success)",
  expired: "var(--ap-danger)",
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/announcements?page=${page}`)
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function deactivate(id: number) {
    await fetch(`/api/admin/announcements/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "expired" }),
    });
    load();
  }

  async function publish(id: number) {
    await fetch(`/api/admin/announcements/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    load();
  }

  const pages = Math.ceil(total / 10);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Announcements</h1>
          <p className={styles.pageSub}>System-wide and institution-specific user notifications</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)}>+ New Announcement</button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Message (English)</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>Expiry Date</th>
              <th>Scope</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.loadingCell}>Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className={styles.emptyCell}>No announcements yet.</td></tr>
            ) : items.map((a: any) => (
              <tr key={a.id}>
                <td style={{ maxWidth: "300px" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "4px" }}>{a.messageEnglish.slice(0, 80)}{a.messageEnglish.length > 80 ? "…" : ""}</div>
                  {a.messageChichewa && <div style={{ fontSize: "0.775rem", color: "var(--ap-text-muted)" }}>{a.messageChichewa.slice(0, 60)}…</div>}
                </td>
                <td>
                  <span style={{
                    display: "inline-block", fontSize: "0.7rem", fontWeight: 700,
                    padding: "3px 8px", borderRadius: "20px", textTransform: "capitalize",
                    color: STATUS_COLORS[a.status],
                    background: `color-mix(in srgb, ${STATUS_COLORS[a.status]} 15%, transparent)`,
                  }}>{a.status}</span>
                </td>
                <td className={styles.dateCell}>{a.startDate ? new Date(a.startDate).toLocaleDateString() : "Immediately"}</td>
                <td className={styles.dateCell} style={{ color: new Date(a.expiryDate) < new Date() ? "var(--ap-danger)" : "var(--ap-text-muted)" }}>
                  {new Date(a.expiryDate).toLocaleDateString()}
                </td>
                <td className={styles.dateCell}>{a.institutionId ? `Institution #${a.institutionId}` : "System-wide"}</td>
                <td>
                  <div className={styles.actionRow}>
                    {a.status === "draft" && <button className={`${styles.actionBtn} ${styles.success}`} onClick={() => publish(a.id)}>Publish</button>}
                    {a.status === "draft" && <button className={styles.actionBtn} onClick={() => setEditing(a)}>Edit</button>}
                    {a.status === "active" && <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => deactivate(a.id)}>Deactivate</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className={styles.pagination}>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      )}

      {showAdd && <AnnouncementModal onClose={() => setShowAdd(false)} onSaved={load} />}
      {editing && <AnnouncementModal announcement={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
}

function AnnouncementModal({ announcement, onClose, onSaved }: { announcement?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!announcement;
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const [form, setForm] = useState({
    messageEnglish: announcement?.messageEnglish || "",
    messageChichewa: announcement?.messageChichewa || "",
    startDate: announcement?.startDate ? announcement.startDate.split("T")[0] : "",
    expiryDate: announcement?.expiryDate ? announcement.expiryDate.split("T")[0] : tomorrow,
    status: announcement?.status || "draft",
    institutionId: announcement?.institutionId || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.messageEnglish.trim()) { setError("English message is required"); return; }
    if (!form.expiryDate) { setError("Expiry date is required"); return; }
    setSaving(true);
    try {
      const body = { ...form, institutionId: form.institutionId ? Number(form.institutionId) : null };
      const url = isEdit ? `/api/admin/announcements/${announcement.id}` : "/api/admin/announcements";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); setError(d.message || "Error"); }
      else { onSaved(); onClose(); }
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEdit ? "Edit Announcement" : "New Announcement"}</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          {error && <div className={styles.formError}>{error}</div>}
          <div className={styles.formSection}>
            <h3>Content</h3>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.375rem", fontSize: "0.8rem", color: "var(--ap-text-secondary)", marginBottom: "0.875rem" }}>
              English Message *
              <textarea value={form.messageEnglish} onChange={e => set("messageEnglish", e.target.value)} rows={3} placeholder="Enter announcement text in English…"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--ap-border)", borderRadius: "8px", padding: "0.75rem", color: "var(--ap-text)", width: "100%", outline: "none" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.375rem", fontSize: "0.8rem", color: "var(--ap-text-secondary)" }}>
              Chichewa Message (optional)
              <textarea value={form.messageChichewa} onChange={e => set("messageChichewa", e.target.value)} rows={3} placeholder="Mawu a Chichewa…"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--ap-border)", borderRadius: "8px", padding: "0.75rem", color: "var(--ap-text)", width: "100%", outline: "none" }} />
            </label>
          </div>
          <div className={styles.formSection}>
            <h3>Scheduling</h3>
            <div className={styles.formGrid}>
              <label>Start Date (optional — defaults to now)<input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} /></label>
              <label>Expiry Date *<input type="date" value={form.expiryDate} onChange={e => set("expiryDate", e.target.value)} /></label>
              <label>Status<select value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="draft">Draft (not visible to users)</option>
                <option value="active">Active (visible immediately)</option>
              </select></label>
              <label>Institution ID (optional — leave blank for system-wide)<input type="number" value={form.institutionId} onChange={e => set("institutionId", e.target.value)} placeholder="e.g. 3" /></label>
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>{saving ? "Saving…" : isEdit ? "Save Changes" : "Create Announcement"}</button>
        </div>
      </div>
    </div>
  );
}
