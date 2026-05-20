"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "../institutions/institutions.module.css";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin-panel/users/stats").then(r => r.json()).then(setStats);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    fetch(`/api/admin-panel/users?${params}`)
      .then(r => r.json())
      .then(d => { setUsers(d.items || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }, [page, search, status, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  async function action(id: number, act: "suspend" | "reactivate") {
    if (act === "suspend" && !confirm("Suspend this user account?")) return;
    await fetch(`/api/admin-panel/users/${id}/${act}`, { method: "POST" });
    load();
  }

  const pages = Math.ceil(total / 20);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>User Management</h1>
          <p className={styles.pageSub}>{total.toLocaleString()} total users</p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Users", value: stats.total || 0 },
          { label: "New This Week", value: stats.thisWeek || 0 },
          { label: "New This Month", value: stats.thisMonth || 0 },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1.25rem 1.5rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--ap-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>{s.label}</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ap-text)" }}>{Number(s.value).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input className={styles.searchInput} placeholder="Search by name or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className={styles.select} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <input className={styles.select} type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} style={{ color: dateFrom ? "var(--ap-text)" : "var(--ap-text-muted)" }} />
        <input className={styles.select} type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} style={{ color: dateTo ? "var(--ap-text)" : "var(--ap-text-muted)" }} />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Registered</th>
              <th>Last Active</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.loadingCell}>Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className={styles.emptyCell}>No users found</td></tr>
            ) : users.map((u: any) => (
              <tr key={u.id}>
                <td className={styles.instName}>{u.fullName}</td>
                <td style={{ fontSize: "0.85rem", color: "var(--ap-text-secondary)" }}>{u.email}</td>
                <td className={styles.dateCell}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className={styles.dateCell}>{u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : "—"}</td>
                <td>
                  <span className={styles.statusDot} style={{ background: u.accountStatus === "active" ? "var(--ap-success)" : "var(--ap-danger)" }} />
                  <span style={{ color: u.accountStatus === "active" ? "var(--ap-success)" : "var(--ap-danger)", fontSize: "0.85rem", fontWeight: 600 }}>
                    {u.accountStatus === "active" ? "Active" : "Suspended"}
                  </span>
                </td>
                <td>
                  <div className={styles.actionRow}>
                    {u.accountStatus === "active"
                      ? <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => action(u.id, "suspend")}>Suspend</button>
                      : <button className={`${styles.actionBtn} ${styles.success}`} onClick={() => action(u.id, "reactivate")}>Reactivate</button>
                    }
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
    </div>
  );
}
