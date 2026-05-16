"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "../institutions/institutions.module.css";

const STATUS_COLORS: Record<string, string> = {
  translated: "var(--ap-success)",
  placeholder: "var(--ap-warning)",
  needs_review: "var(--ap-info)",
};

export default function ContentPage() {
  const [strings, setStrings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    fetch(`/api/admin/content?${params}`)
      .then(r => r.json())
      .then(d => { setStrings(d.items || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }, [page, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / 30);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Content &amp; Language Management</h1>
          <p className={styles.pageSub}>{total} content strings · Changes reflect in the live system immediately</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)}>+ New String</button>
      </div>

      <div className={styles.filters}>
        <input className={styles.searchInput} placeholder="Search by key or English text…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className={styles.select} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="translated">✓ Translated</option>
          <option value="placeholder">⚠ Placeholder (Needs Translation)</option>
          <option value="needs_review">👁 Needs Review</option>
        </select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Key</th>
              <th>English</th>
              <th>Chichewa</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className={styles.loadingCell}>Loading…</td></tr>
            ) : strings.length === 0 ? (
              <tr><td colSpan={5} className={styles.emptyCell}>No content strings found.</td></tr>
            ) : strings.map((s: any) => (
              <tr key={s.id}>
                <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--ap-accent-light)" }}>{s.key}</td>
                <td style={{ fontSize: "0.875rem", maxWidth: "250px", wordBreak: "break-word" }}>{s.english}</td>
                <td style={{ fontSize: "0.875rem", maxWidth: "250px", wordBreak: "break-word", color: s.chichewa ? "var(--ap-text)" : "var(--ap-text-muted)", fontStyle: s.chichewa ? "normal" : "italic" }}>
                  {s.chichewa || "Not translated"}
                </td>
                <td>
                  <span style={{
                    display: "inline-block", fontSize: "0.7rem", fontWeight: 700,
                    padding: "3px 8px", borderRadius: "20px", textTransform: "capitalize",
                    background: `color-mix(in srgb, ${STATUS_COLORS[s.status]} 15%, transparent)`,
                    color: STATUS_COLORS[s.status],
                  }}>{s.status.replace("_", " ")}</span>
                </td>
                <td>
                  <div className={styles.actionRow}>
                    <button className={styles.actionBtn} onClick={() => setEditing(s)}>Edit</button>
                    {s.status !== "needs_review" && (
                      <button className={`${styles.actionBtn} ${styles.warning}`} onClick={async () => {
                        await fetch(`/api/admin/content/${s.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "needs_review" }) });
                        load();
                      }}>Flag Review</button>
                    )}
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

      {editing && <EditStringModal str={editing} onClose={() => setEditing(null)} onSaved={load} />}
      {showAdd && <AddStringModal onClose={() => setShowAdd(false)} onSaved={load} />}
    </div>
  );
}

function EditStringModal({ str, onClose, onSaved }: { str: any; onClose: () => void; onSaved: () => void }) {
  const [english, setEnglish] = useState(str.english);
  const [chichewa, setChichewa] = useState(str.chichewa || "");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/content/${str.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ english, chichewa }),
    });
    setSaving(false);
    onSaved(); onClose();
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h2>Edit Content String</h2>
            <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--ap-accent-light)", marginTop: "4px" }}>{str.key}</div>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          {preview ? (
            <div className={styles.formSection}>
              <h3>Preview</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "1rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--ap-text-muted)", marginBottom: "0.5rem", textTransform: "uppercase" }}>English</div>
                  <div style={{ color: "var(--ap-text)", fontSize: "0.9rem" }}>{english}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "1rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--ap-text-muted)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Chichewa</div>
                  <div style={{ color: "var(--ap-text)", fontSize: "0.9rem" }}>{chichewa || <em style={{ color: "var(--ap-text-muted)" }}>Not translated</em>}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.formSection}>
              <h3>English Text</h3>
              <textarea value={english} onChange={e => setEnglish(e.target.value)} rows={4}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--ap-border)", borderRadius: "8px", padding: "0.75rem", color: "var(--ap-text)", width: "100%", outline: "none", resize: "vertical" }} />
              <h3 style={{ marginTop: "1rem" }}>Chichewa Text</h3>
              <textarea value={chichewa} onChange={e => setChichewa(e.target.value)} rows={4} placeholder="Enter Chichewa translation…"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--ap-border)", borderRadius: "8px", padding: "0.75rem", color: "var(--ap-text)", width: "100%", outline: "none", resize: "vertical" }} />
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={() => setPreview(v => !v)}>
            {preview ? "← Back to Edit" : "Preview →"}
          </button>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}

function AddStringModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ key: "", english: "", chichewa: "", status: "placeholder" as const });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!form.key || !form.english) { setError("Key and English text are required"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!res.ok) setError("Failed to create");
    else { onSaved(); onClose(); }
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Add Content String</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          {error && <div className={styles.formError}>{error}</div>}
          <div className={styles.formSection}>
            <h3>String Details</h3>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.375rem", fontSize: "0.8rem", color: "var(--ap-text-secondary)", marginBottom: "0.875rem" }}>
              Key (machine-readable, e.g. "institution.finca.description")
              <input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} placeholder="institution.name.description"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--ap-border)", borderRadius: "8px", padding: "0.625rem", color: "var(--ap-accent-light)", fontFamily: "monospace", outline: "none" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.375rem", fontSize: "0.8rem", color: "var(--ap-text-secondary)", marginBottom: "0.875rem" }}>
              English Text *
              <textarea value={form.english} onChange={e => setForm(f => ({ ...f, english: e.target.value }))} rows={3}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--ap-border)", borderRadius: "8px", padding: "0.625rem", color: "var(--ap-text)", width: "100%", outline: "none" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.375rem", fontSize: "0.8rem", color: "var(--ap-text-secondary)" }}>
              Chichewa Text (optional — can be added later)
              <textarea value={form.chichewa} onChange={e => setForm(f => ({ ...f, chichewa: e.target.value }))} rows={3} placeholder="Chichewa translation…"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--ap-border)", borderRadius: "8px", padding: "0.625rem", color: "var(--ap-text)", width: "100%", outline: "none" }} />
            </label>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>{saving ? "Saving…" : "Create String"}</button>
        </div>
      </div>
    </div>
  );
}
