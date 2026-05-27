'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function LoanSchedulePage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingMonth, setMarkingMonth] = useState<number | null>(null);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/loans/schedule/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load schedule');
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id]);

  const markNextMonthPaid = async (month: number) => {
    if (!confirm(`Mark month ${month} as paid?`)) return;
    setMarkingMonth(month);
    try {
      const res = await fetch(`/api/loans/repay/${params.id}`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Could not mark month as paid");
      }
      const updated = await fetch(`/api/loans/schedule/${params.id}`).then(r => r.json());
      setData(updated);
    } catch (err: any) {
      alert(err.message || "Network error. Please try again.");
    } finally {
      setMarkingMonth(null);
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading schedule...</div>;
  if (error)
    return (
      <div className="alert alert-danger" style={{ margin: 40 }}>
        {error}
      </div>
    );
  if (!data || !data.loan)
    return <div style={{ padding: 40 }}>Loan not found</div>;

  const { loan, schedule } = data;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xl)',
      }}
    >
      <div>
        <Link href="/user/dashboard/loans" className="btn btn-ghost btn-sm" style={{ marginBottom: "var(--space-sm)" }}>
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 className="text-h2">Amortization Schedule</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {loan.application?.purpose || loan.loanPurpose || 'Manual Loan'} ·{' '}
          {loan.providerInstitution?.name || loan.providerName || 'Institution'}
        </p>
      </div>

      <div className="grid-4" style={{ gap: 'var(--space-md)' }}>
        <div className="card">
          <div className="text-xs text-muted">Principal Amount</div>
          <div className="text-h3">MK {loan.loanAmount.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Interest Rate</div>
          <div className="text-h3">{loan.interestRate}% p.a.</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Monthly EMI</div>
          <div className="text-h3 text-primary">
            MK{' '}
            {loan.monthlyDeduction.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Remaining Balance</div>
          <div className="text-h3 text-warning">
            MK{' '}
            {loan.remainingBalance.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto', padding: '1rem' }}>
        <table
          style={{
            width: '100%',
            textAlign: 'left',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
              <th style={{ padding: "12px 8px" }}>Month</th>
              <th style={{ padding: "12px 8px" }}>Status</th>
              <th style={{ padding: "12px 8px" }}>EMI (MK)</th>
              <th style={{ padding: "12px 8px" }}>Principal (MK)</th>
              <th style={{ padding: "12px 8px" }}>Interest (MK)</th>
              <th style={{ padding: "12px 8px" }}>Balance (MK)</th>
              <th style={{ padding: "12px 8px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((row: any) => (
              <tr
                key={row.month}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  opacity: row.isPaid ? 0.6 : 1,
                  background: row.isPaid
                    ? 'rgba(0, 200, 150, 0.05)'
                    : 'transparent',
                }}
              >
                <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                  {row.month}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  {row.isPaid ? (
                    <span className="badge badge-success text-xs">Paid</span>
                  ) : (
                    <span className="badge badge-neutral text-xs">Pending</span>
                  )}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  {row.installment.toLocaleString()}
                </td>
                <td
                  style={{ padding: '12px 8px', color: 'var(--color-primary)' }}
                >
                  {row.principal.toLocaleString()}
                </td>
                <td
                  style={{ padding: '12px 8px', color: 'var(--color-warning)' }}
                >
                  {row.interest.toLocaleString()}
                </td>
                <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                  {row.balance.toLocaleString()}
                </td>
                <td style={{ padding: "12px 8px" }}>
                  {row.isPaid ? (
                    <span className="text-xs text-muted">Recorded</span>
                  ) : row.month === loan.paidMonths + 1 && loan.isActive ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => markNextMonthPaid(row.month)}
                      disabled={markingMonth === row.month}
                    >
                      {markingMonth === row.month ? "Saving..." : "Mark Month Paid"}
                    </button>
                  ) : (
                    <span className="text-xs text-muted">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
