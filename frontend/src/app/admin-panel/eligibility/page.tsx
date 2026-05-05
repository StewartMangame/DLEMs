"use client";
import { useState, useEffect } from "react";
import styles from "../institutions/institutions.module.css";

export default function EligibilityMonitorPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin-panel/eligibility/stats")
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loadingCell} style={{ padding: "3rem" }}>Loading…</div>;
  if (!stats) return null;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Eligibility Check Monitor</h1>
          <p className={styles.pageSub}>Anonymised aggregate data — no individual user data shown</p>
        </div>
      </div>

      {/* Volume stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Today", value: stats.today },
          { label: "This Week", value: stats.thisWeek },
          { label: "This Month", value: stats.thisMonth },
          { label: "All Time", value: stats.allTime },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "1.25rem 1.5rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--ap-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>{s.label}</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--ap-text)" }}>{Number(s.value || 0).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* By institution */}
      <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ap-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
        Breakdown by Institution
      </h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Institution</th>
              <th>Type</th>
              <th>Total Checks</th>
              <th>Likely Eligible</th>
              <th>Borderline</th>
              <th>Not Eligible</th>
              <th>Eligible Rate</th>
            </tr>
          </thead>
          <tbody>
            {!stats.byInstitution?.length ? (
              <tr><td colSpan={7} className={styles.emptyCell}>No eligibility check data yet. Checks are recorded when users run the eligibility engine.</td></tr>
            ) : stats.byInstitution.map((row: any) => {
              const total = Number(row.total) || 1;
              const eligPct = Math.round((Number(row.eligible || 0) / total) * 100);
              return (
                <tr key={row.institution}>
                  <td className={styles.instName}>{row.institution}</td>
                  <td><span className={styles.typeBadge}>{row.type || "—"}</span></td>
                  <td style={{ fontWeight: 700 }}>{Number(row.total).toLocaleString()}</td>
                  <td style={{ color: "var(--ap-success)" }}>{Number(row.eligible || 0).toLocaleString()}</td>
                  <td style={{ color: "var(--ap-warning)" }}>{Number(row.borderline || 0).toLocaleString()}</td>
                  <td style={{ color: "var(--ap-danger)" }}>{Number(row.ineligible || 0).toLocaleString()}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${eligPct}%`, height: "100%", background: eligPct > 60 ? "var(--ap-success)" : eligPct > 30 ? "var(--ap-warning)" : "var(--ap-danger)", borderRadius: "3px" }} />
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ap-text)", minWidth: "2.5rem" }}>{eligPct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
