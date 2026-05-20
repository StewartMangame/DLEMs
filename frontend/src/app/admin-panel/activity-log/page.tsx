"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "../institutions/institutions.module.css";

export default function ActivityLogPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [adminFilter, setAdminFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (adminFilter) params.set("adminId", adminFilter);
    if (actionFilter) params.set("action", actionFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    fetch(`/api/admin-panel/activity-log?${params}`)
      .then(r => { if (!r.ok) throw new Error("Forbidden"); return r.json(); })
      .then(d => { setEntries(d.items || []); setTotal(d.total || 0); })
      .catch(e => setError(e.message === "Forbidden" ? "Super Admin access required." : "Failed to load"))
      .finally(() => setLoading(false));
  }, [page, adminFilter, actionFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / 50);

  const ACTION_COLORS: Record<string, string> = {
    create: "var(--ap-success)", update: "var(--ap-info)",
    deactivate: "var(--ap-warning)", verify: "var(--ap-success)",
    suspend: "var(--ap-danger)", delete: "var(--ap-danger)",
  };

  function getActionColor(action: string) {
    const prefix = action.split(".")[1] || "";
    return ACTION_COLORS[prefix] || "var(--ap-text-muted)";
  }

  if (error) return (
    <div>
      <h1 className={styles.pageTitle}>Admin Activity Log</h1>
      <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", padding: "1.25rem", color: "#fca5a5", marginTop: "1rem" }}>{error}</div>
    </div>
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin Activity Log</h1>
          <p className={styles.pageSub}>{total.toLocaleString()} total log entries · Write-only — cannot be edited or deleted</p>
        </div>
      </div>

      <div className={styles.filters}>
        <input className={styles.searchInput} placeholder="Filter by action (e.g. institution.update)…" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} />
        <input className={styles.select} type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} style={{ color: dateFrom ? "var(--ap-text)" : "var(--ap-text-muted)" }} />
        <input className={styles.select} type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} style={{ color: dateTo ? "var(--ap-text)" : "var(--ap-text-muted)" }} />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Field Changed</th>
              <th>Old Value</th>
              <th>New Value</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className={styles.loadingCell}>Loading…</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={8} className={styles.emptyCell}>No activity logged yet.</td></tr>
            ) : entries.map((e: any) => (
              <tr key={e.id}>
                <td className={styles.dateCell} style={{ whiteSpace: "nowrap" }}>{new Date(e.createdAt).toLocaleString()}</td>
                <td style={{ fontSize: "0.85rem", color: "var(--ap-text)" }}>{e.admin?.email || "—"}</td>
                <td>
                  <span style={{
                    display: "inline-block", fontSize: "0.7rem", fontWeight: 700,
                    padding: "3px 8px", borderRadius: "20px", fontFamily: "monospace",
                    color: getActionColor(e.action),
                    background: `color-mix(in srgb, ${getActionColor(e.action)} 12%, transparent)`,
                  }}>{e.action}</span>
                </td>
                <td style={{ fontSize: "0.8rem", color: "var(--ap-text-secondary)" }}>
                  {e.entityType}{e.entityId ? ` #${e.entityId}` : ""}
                </td>
                <td style={{ fontSize: "0.8rem", color: "var(--ap-text-secondary)", fontFamily: "monospace" }}>{e.fieldChanged || "—"}</td>
                <td style={{ fontSize: "0.775rem", color: "var(--ap-danger)", fontFamily: "monospace", maxWidth: "120px", wordBreak: "break-all" }}>{e.oldValue || "—"}</td>
                <td style={{ fontSize: "0.775rem", color: "var(--ap-success)", fontFamily: "monospace", maxWidth: "120px", wordBreak: "break-all" }}>{e.newValue || "—"}</td>
                <td style={{ fontSize: "0.775rem", color: "var(--ap-text-muted)", maxWidth: "180px" }}>{e.description || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className={styles.pagination}>
          {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map(p => (
            <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          {pages > 10 && <span style={{ color: "var(--ap-text-muted)", fontSize: "0.875rem", padding: "0.5rem" }}>…{pages} pages</span>}
        </div>
      )}
    </div>
  );
}
