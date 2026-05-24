'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ModalCloseButton } from '../icons';
import styles from './institutions.module.css';

const STATUS_COLORS: Record<string, string> = {
  active: 'var(--ap-success)',
  inactive: '#475569',
  pending_verification: 'var(--ap-warning)',
};
const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending_verification: 'Pending Verification',
};

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (search) params.set('search', search);
    if (typeFilter) params.set('type', typeFilter);
    fetch(`/api/admin-panel/institutions?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setInstitutions(d.items || []);
        setTotal(d.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, search, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function quickAction(id: number, action: string) {
    const statusMap: Record<string, string> = {
      deactivate: 'inactive',
      activate: 'active',
      flag: 'pending_verification',
    };
    await fetch(`/api/admin-panel/institutions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusMap[action] }),
    });
    load();
  }

  async function verify(id: number) {
    const days = prompt('Set next review due (days from today):', '180');
    const reviewDueDate = days
      ? new Date(Date.now() + Number(days) * 86400000).toISOString()
      : undefined;
    await fetch(`/api/admin-panel/institutions/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewDueDate }),
    });
    load();
  }

  const pages = Math.ceil(total / 15);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Institution Management</h1>
          <p className={styles.pageSub}>{total} institutions in the system</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          + Add Institution
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          placeholder="Search institutions…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className={styles.select}
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Types</option>
          <option value="bank">Commercial Banks</option>
          <option value="microfinance">Microfinance</option>
          <option value="sacco">SACCO</option>
        </select>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Institution</th>
              <th>Type</th>
              <th>Status</th>
              <th>Review Due</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles.loadingCell}>
                  Loading…
                </td>
              </tr>
            ) : institutions.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  No institutions found
                </td>
              </tr>
            ) : (
              institutions.map((inst) => (
                <tr key={inst.id}>
                  <td>
                    <div className={styles.instName}>{inst.name}</div>
                    {inst.description && (
                      <div className={styles.instDesc}>
                        {inst.description.slice(0, 60)}…
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={styles.typeBadge}>{inst.type}</span>
                  </td>
                  <td>
                    <span
                      className={styles.statusDot}
                      style={{ background: STATUS_COLORS[inst.status] }}
                    />
                    <span
                      style={{
                        color: STATUS_COLORS[inst.status],
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      {STATUS_LABELS[inst.status] || inst.status}
                    </span>
                  </td>
                  <td className={styles.dateCell}>
                    {inst.reviewDueDate ? (
                      <span
                        style={{
                          color:
                            new Date(inst.reviewDueDate) < new Date()
                              ? 'var(--ap-danger)'
                              : 'var(--ap-text-muted)',
                        }}
                      >
                        {new Date(inst.reviewDueDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                  <td className={styles.dateCell}>
                    {new Date(inst.updatedAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className={styles.actionRow}>
                      <Link
                        href={`/admin-panel/institutions/${inst.id}`}
                        className={styles.actionBtn}
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin-panel/institutions/${inst.id}/changelog`}
                        className={styles.actionBtn}
                      >
                        Log
                      </Link>
                      {inst.status !== 'active' ? (
                        <button
                          className={`${styles.actionBtn} ${styles.success}`}
                          onClick={() => quickAction(inst.id, 'activate')}
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          className={`${styles.actionBtn} ${styles.danger}`}
                          onClick={() => quickAction(inst.id, 'deactivate')}
                        >
                          Deactivate
                        </button>
                      )}
                      {inst.status !== 'pending_verification' && (
                        <button
                          className={`${styles.actionBtn} ${styles.warning}`}
                          onClick={() => quickAction(inst.id, 'flag')}
                        >
                          Flag
                        </button>
                      )}
                      {inst.status === 'pending_verification' && (
                        <button
                          className={`${styles.actionBtn} ${styles.success}`}
                          onClick={() => verify(inst.id)}
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className={styles.pagination}>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddInstitutionModal
          onClose={() => setShowAddModal(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

function AddInstitutionModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    type: 'bank',
    status: 'active',
    description: '',
    isInterestRateFixed: true,
    requiresCrbCheck: false,
    collateralAccepted: false,
    turnaroundTime: '5-7 working days',
    reminderAvailable: false,
    digitalApplicationAvailable: false,
    maxDtiRatio: 0.4,
    minNetSalary: 50000,
    interestRate: 25,
    processingFeePercent: 1.5,
    minRepaymentMonths: 3,
    maxRepaymentMonths: 60,
    civilServantMultiplier: 8,
    privateMultiplier: 5,
    selfEmployedMultiplier: 3,
    saccoMemberMultiplier: 6,
    requiresGuarantor: false,
    requiresPayslip: true,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name.trim()) {
      setError('Institution name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin-panel/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.message || 'Failed to create institution');
      } else {
        onSaved();
        onClose();
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Add New Institution</h2>
          <ModalCloseButton className={styles.modalClose} onClose={onClose} />
        </div>
        <div className={styles.modalBody}>
          {error && <div className={styles.formError}>{error}</div>}

          <div className={styles.formSection}>
            <h3>General Information</h3>
            <div className={styles.formGrid}>
              <label>
                Name *
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Malawi Savings Bank"
                />
              </label>
              <label>
                Type
                <select
                  value={form.type}
                  onChange={(e) => set('type', e.target.value)}
                >
                  <option value="bank">Commercial Bank</option>
                  <option value="microfinance">Microfinance</option>
                  <option value="sacco">SACCO</option>
                </select>
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending_verification">
                    Pending Verification
                  </option>
                </select>
              </label>
              <label>
                Turnaround Time
                <input
                  value={form.turnaroundTime}
                  onChange={(e) => set('turnaroundTime', e.target.value)}
                />
              </label>
            </div>
            <label>
              Description
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                placeholder="Brief description shown to users…"
              />
            </label>
          </div>

          <div className={styles.formSection}>
            <h3>Loan Criteria</h3>
            <div className={styles.formGrid}>
              <label>
                Min Net Salary (MWK)
                <input
                  type="number"
                  value={form.minNetSalary}
                  onChange={(e) => set('minNetSalary', +e.target.value)}
                />
              </label>
              <label>
                Debt-to-Income Cap (%)
                <input
                  type="number"
                  step="0.01"
                  max="1"
                  value={form.maxDtiRatio}
                  onChange={(e) => set('maxDtiRatio', +e.target.value)}
                />
              </label>
              <label>
                Interest Rate (% p.a.)
                <input
                  type="number"
                  value={form.interestRate}
                  onChange={(e) => set('interestRate', +e.target.value)}
                />
              </label>
              <label>
                Processing Fee (%)
                <input
                  type="number"
                  step="0.1"
                  value={form.processingFeePercent}
                  onChange={(e) => set('processingFeePercent', +e.target.value)}
                />
              </label>
              <label>
                Min Repayment (months)
                <input
                  type="number"
                  value={form.minRepaymentMonths}
                  onChange={(e) => set('minRepaymentMonths', +e.target.value)}
                />
              </label>
              <label>
                Max Repayment (months)
                <input
                  type="number"
                  value={form.maxRepaymentMonths}
                  onChange={(e) => set('maxRepaymentMonths', +e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Salary Multipliers</h3>
            <div className={styles.formGrid}>
              <label>
                Civil Servant ×
                <input
                  type="number"
                  value={form.civilServantMultiplier}
                  onChange={(e) =>
                    set('civilServantMultiplier', +e.target.value)
                  }
                />
              </label>
              <label>
                Private Sector ×
                <input
                  type="number"
                  value={form.privateMultiplier}
                  onChange={(e) => set('privateMultiplier', +e.target.value)}
                />
              </label>
              <label>
                Self-Employed ×
                <input
                  type="number"
                  value={form.selfEmployedMultiplier}
                  onChange={(e) =>
                    set('selfEmployedMultiplier', +e.target.value)
                  }
                />
              </label>
              <label>
                SACCO Member ×
                <input
                  type="number"
                  value={form.saccoMemberMultiplier}
                  onChange={(e) =>
                    set('saccoMemberMultiplier', +e.target.value)
                  }
                />
              </label>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Features &amp; Requirements</h3>
            <div className={styles.checkboxGrid}>
              {[
                ['isInterestRateFixed', 'Fixed / known interest rate'],
                ['requiresCrbCheck', 'CRB check required'],
                ['collateralAccepted', 'Collateral accepted'],
                ['reminderAvailable', 'Repayment reminders available'],
                [
                  'digitalApplicationAvailable',
                  'Digital application available',
                ],
                ['requiresGuarantor', 'Guarantor required'],
                ['requiresPayslip', 'Payslip required'],
              ].map(([key, label]) => (
                <label key={key} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={!!(form as any)[key]}
                    onChange={(e) => set(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Notes (shown to users)</h3>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              placeholder="Optional notes about eligibility conditions…"
            />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Create Institution'}
          </button>
        </div>
      </div>
    </div>
  );
}
