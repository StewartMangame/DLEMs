"use client";
import { useState, useEffect, useCallback } from "react";
import { readJson } from "@/lib/http";
import { useLanguage } from "@/lib/LanguageContext";
import styles from "../institutions/institutions.module.css";

export default function UsersPage() {
  const { t } = useLanguage();
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
    fetch("/api/admin-panel/users/stats")
      .then((r) => readJson(r, "Failed to load user stats"))
      .then(setStats)
      .catch(() => setStats({}));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    fetch(`/api/admin-panel/users?${params}`)
      .then((r) => readJson(r, "Failed to load users"))
      .then(d => { setUsers(d.items || []); setTotal(d.total || 0); })
      .catch(() => { setUsers([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [page, search, status, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  async function action(id: number, act: "suspend" | "reactivate") {
    if (act === "suspend" && !confirm(t("admin.users.suspendConfirm"))) return;
    await fetch(`/api/admin-panel/users/${id}/${act}`, { method: "POST" });
    load();
  }

  const pages = Math.ceil(total / 20);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t("admin.users.title")}</h1>
          <p className={styles.pageSub}>{t("admin.users.totalUsers", { total: total.toLocaleString() })}</p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: t("admin.dashboard.totalUsers"), value: stats.total || 0 },
          { label: t("admin.dashboard.newThisWeek"), value: stats.thisWeek || 0 },
          { label: t("admin.dashboard.newThisMonth"), value: stats.thisMonth || 0 },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1.25rem 1.5rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--ap-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>{s.label}</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ap-text)" }}>{Number(s.value).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input className={styles.searchInput} placeholder={t("admin.users.searchPlaceholder")} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className={styles.select} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">{t("admin.users.allStatuses")}</option>
          <option value="active">{t("admin.users.active")}</option>
          <option value="suspended">{t("admin.users.suspended")}</option>
        </select>
        <input className={styles.select} type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} style={{ color: dateFrom ? "var(--ap-text)" : "var(--ap-text-muted)" }} />
        <input className={styles.select} type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} style={{ color: dateTo ? "var(--ap-text)" : "var(--ap-text-muted)" }} />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("admin.users.user")}</th>
              <th>{t("admin.users.email")}</th>
              <th>{t("admin.users.registered")}</th>
              <th>{t("admin.users.lastActive")}</th>
              <th>{t("admin.users.status")}</th>
              <th>{t("admin.users.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.loadingCell}>{t("admin.users.loading")}</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className={styles.emptyCell}>{t("admin.users.empty")}</td></tr>
            ) : users.map((u: any) => (
              <tr key={u.id}>
                <td className={styles.instName}>{u.fullName}</td>
                <td style={{ fontSize: "0.85rem", color: "var(--ap-text-secondary)" }}>{u.email}</td>
                <td className={styles.dateCell}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className={styles.dateCell}>{u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : "—"}</td>
                <td>
                  <span className={styles.statusDot} style={{ background: u.accountStatus === "active" ? "var(--ap-success)" : "var(--ap-danger)" }} />
                  <span style={{ color: u.accountStatus === "active" ? "var(--ap-success)" : "var(--ap-danger)", fontSize: "0.85rem", fontWeight: 600 }}>
                    {u.accountStatus === "active" ? t("admin.users.active") : t("admin.users.suspended")}
                  </span>
                </td>
                <td>
                  <div className={styles.actionRow}>
                    {u.accountStatus === "active"
                      ? <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => action(u.id, "suspend")}>{t("admin.users.suspend")}</button>
                      : <button className={`${styles.actionBtn} ${styles.success}`} onClick={() => action(u.id, "reactivate")}>{t("admin.users.reactivate")}</button>
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
