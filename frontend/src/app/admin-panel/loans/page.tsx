'use client';
import { useState, useEffect } from 'react';
import { readJson } from '@/lib/http';
import styles from '../institutions/institutions.module.css';

export default function LoanMonitorPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin-panel/loans/stats')
      .then((r) => readJson(r, 'Failed to load loan stats'))
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div style={{ padding: '3rem', color: 'var(--ap-text-muted)' }}>
        Loading…
      </div>
    );
  if (!stats) return null;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Loan Tracking Monitor</h1>
          <p className={styles.pageSub}>
            Aggregate data from user loan records — no individual user details
            shown
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {[
          {
            label: 'Total Loans Recorded',
            value: stats.total,
            color: 'var(--ap-text)',
          },
          {
            label: 'Active Loans',
            value: stats.active,
            color: 'var(--ap-success)',
          },
          {
            label: 'Completed Loans',
            value: stats.completed,
            color: 'var(--ap-info)',
          },
          {
            label: 'New This Month',
            value: stats.thisMonth,
            color: 'var(--ap-warning)',
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '1.25rem 1.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--ap-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.5rem',
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>
              {Number(s.value || 0).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <h2
        style={{
          fontSize: '0.875rem',
          fontWeight: 700,
          color: 'var(--ap-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '1rem',
        }}
      >
        Loans by Institution
      </h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Institution / Lender</th>
              <th>Loan Count</th>
              <th>Avg Loan Amount (MWK)</th>
            </tr>
          </thead>
          <tbody>
            {!stats.byInstitution?.length ? (
              <tr>
                <td colSpan={3} className={styles.emptyCell}>
                  No loan data recorded yet.
                </td>
              </tr>
            ) : (
              stats.byInstitution.map((row: any) => (
                <tr key={row.institution}>
                  <td className={styles.instName}>
                    {row.institution || 'Unknown'}
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {Number(row.count).toLocaleString()}
                  </td>
                  <td>
                    MWK{' '}
                    {Number(row.avgAmount || 0).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
