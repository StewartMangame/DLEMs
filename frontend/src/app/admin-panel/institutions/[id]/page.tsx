'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, X } from 'lucide-react';
import { ModalCloseButton } from '../../icons';
import styles from '../../institutions/institutions.module.css';

export default function EditInstitutionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [criteriaForm, setCriteriaForm] = useState<any>({});
  const [docs, setDocs] = useState<string[]>([]);
  const [newDoc, setNewDoc] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [tab, setTab] = useState<'general' | 'criteria' | 'docs' | 'products'>(
    'general',
  );
  const [showAddProduct, setShowAddProduct] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/admin-panel/institutions/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.institution);
        setForm({
          name: d.institution.name,
          type: d.institution.type,
          status: d.institution.status,
          description: d.institution.description || '',
          turnaroundTime: d.institution.turnaroundTime || '',
          isInterestRateFixed: d.institution.isInterestRateFixed,
          requiresCrbCheck: d.institution.requiresCrbCheck,
          collateralAccepted: d.institution.collateralAccepted,
          reminderAvailable: d.institution.reminderAvailable,
          digitalApplicationAvailable:
            d.institution.digitalApplicationAvailable,
          reviewDueDate: d.institution.reviewDueDate
            ? d.institution.reviewDueDate.split('T')[0]
            : '',
        });
        setDocs(d.institution.requiredDocuments || []);
        if (d.institution.criteria) {
          const c = d.institution.criteria;
          setCriteriaForm({
            maxDtiRatio: c.maxDtiRatio,
            minNetSalary: c.minNetSalary,
            interestRate: c.interestRate,
            processingFeePercent: c.processingFeePercent,
            minRepaymentMonths: c.minRepaymentMonths,
            maxRepaymentMonths: c.maxRepaymentMonths,
            civilServantMultiplier: c.civilServantMultiplier,
            privateMultiplier: c.privateMultiplier,
            selfEmployedMultiplier: c.selfEmployedMultiplier,
            saccoMemberMultiplier: c.saccoMemberMultiplier,
            requiresGuarantor: c.requiresGuarantor,
            requiresPayslip: c.requiresPayslip,
            notes: c.notes || '',
            customCriteria: c.customCriteria || [],
          });
        }
        setProducts(d.products || []);
      });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    setFeedback(null);
    const body = { ...form, requiredDocuments: docs, criteria: criteriaForm };
    const res = await fetch(`/api/admin-panel/institutions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok)
      setFeedback({ type: 'success', text: 'Changes saved successfully' });
    else setFeedback({ type: 'error', text: 'Failed to save changes' });
  }

  function addDoc() {
    if (newDoc.trim()) {
      setDocs((d) => [...d, newDoc.trim()]);
      setNewDoc('');
    }
  }
  function removeDoc(i: number) {
    setDocs((d) => d.filter((_, idx) => idx !== i));
  }

  if (!data)
    return (
      <div style={{ padding: '3rem', color: 'var(--ap-text-muted)' }}>
        Loading…
      </div>
    );

  const TABS = [
    { key: 'general', label: 'General' },
    { key: 'criteria', label: 'Loan Criteria' },
    { key: 'docs', label: 'Required Docs' },
    { key: 'products', label: 'Loan Products' },
  ] as const;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--ap-text-muted)',
              marginBottom: '0.5rem',
            }}
          >
            <Link
              href="/admin-panel/institutions"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                color: 'var(--ap-accent-light)',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={14} aria-hidden />
              Institutions
            </Link>
          </div>
          <h1 className={styles.pageTitle}>{data.name}</h1>
          <p className={styles.pageSub}>
            {data.type} · Last updated{' '}
            {new Date(data.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            href={`/admin-panel/institutions/${id}/changelog`}
            className={styles.actionBtn}
          >
            View Change Log
          </Link>
          <button
            className={styles.saveBtn}
            onClick={save}
            disabled={saving}
            style={{ padding: '0.625rem 1.5rem' }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={
            feedback.type === 'success' ? styles.successMsg : styles.formError
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={16} aria-hidden />
          ) : (
            <XCircle size={16} aria-hidden />
          )}
          {feedback.text}
        </div>
      )}

      {/* Tab Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: '1.5rem',
          background: 'var(--ap-surface)',
          borderRadius: '10px',
          padding: '4px',
          border: '1px solid var(--ap-border)',
          width: 'fit-content',
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '7px',
              border: 'none',
              background:
                tab === t.key ? 'rgba(124,58,237,0.2)' : 'transparent',
              color:
                tab === t.key
                  ? 'var(--ap-accent-light)'
                  : 'var(--ap-text-muted)',
              fontWeight: tab === t.key ? 700 : 400,
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        className={styles.modal}
        style={{
          position: 'static',
          maxHeight: 'none',
          maxWidth: 'none',
          borderRadius: '14px',
        }}
      >
        <div
          className={styles.modalBody}
          style={{ maxHeight: 'none', overflow: 'visible' }}
        >
          {tab === 'general' && (
            <>
              <div className={styles.formSection}>
                <h3>General Information</h3>
                <div className={styles.formGrid}>
                  <label>
                    Name
                    <input
                      value={form.name || ''}
                      onChange={(e) =>
                        setForm((f: any) => ({ ...f, name: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Type
                    <select
                      value={form.type || ''}
                      onChange={(e) =>
                        setForm((f: any) => ({ ...f, type: e.target.value }))
                      }
                    >
                      <option value="bank">Commercial Bank</option>
                      <option value="microfinance">Microfinance</option>
                      <option value="sacco">SACCO</option>
                    </select>
                  </label>
                  <label>
                    Status
                    <select
                      value={form.status || ''}
                      onChange={(e) =>
                        setForm((f: any) => ({ ...f, status: e.target.value }))
                      }
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
                      value={form.turnaroundTime || ''}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          turnaroundTime: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Review Due Date
                    <input
                      type="date"
                      value={form.reviewDueDate || ''}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          reviewDueDate: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                    fontSize: '0.8rem',
                    color: 'var(--ap-text-secondary)',
                  }}
                >
                  Description
                  <textarea
                    value={form.description || ''}
                    onChange={(e) =>
                      setForm((f: any) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--ap-border)',
                      borderRadius: '8px',
                      padding: '0.625rem',
                      color: 'var(--ap-text)',
                      width: '100%',
                      outline: 'none',
                    }}
                  />
                </label>
              </div>
              <div className={styles.formSection}>
                <h3>Features</h3>
                <div className={styles.checkboxGrid}>
                  {(
                    [
                      ['isInterestRateFixed', 'Fixed / known interest rate'],
                      ['requiresCrbCheck', 'CRB check required'],
                      ['collateralAccepted', 'Collateral accepted'],
                      ['reminderAvailable', 'Repayment reminders available'],
                      [
                        'digitalApplicationAvailable',
                        'Digital application available',
                      ],
                    ] as [string, string][]
                  ).map(([key, label]) => (
                    <label key={key} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={!!form[key]}
                        onChange={(e) =>
                          setForm((f: any) => ({
                            ...f,
                            [key]: e.target.checked,
                          }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'criteria' && (
            <div className={styles.formSection}>
              <h3>Eligibility Criteria</h3>
              <div className={styles.formGrid}>
                {(
                  [
                    ['minNetSalary', 'Min Net Salary (MWK)', 'number'],
                    ['maxDtiRatio', 'DTI Cap (e.g. 0.40 = 40%)', 'number'],
                    ['interestRate', 'Interest Rate (% p.a.)', 'number'],
                    ['processingFeePercent', 'Processing Fee (%)', 'number'],
                    ['minRepaymentMonths', 'Min Repayment (months)', 'number'],
                    ['maxRepaymentMonths', 'Max Repayment (months)', 'number'],
                    [
                      'civilServantMultiplier',
                      'Civil Servant Multiplier ×',
                      'number',
                    ],
                    [
                      'privateMultiplier',
                      'Private Sector Multiplier ×',
                      'number',
                    ],
                    [
                      'selfEmployedMultiplier',
                      'Self-Employed Multiplier ×',
                      'number',
                    ],
                    [
                      'saccoMemberMultiplier',
                      'SACCO Member Multiplier ×',
                      'number',
                    ],
                  ] as [string, string, string][]
                ).map(([key, lbl, type]) => (
                  <label key={key}>
                    {lbl}
                    <input
                      type={type}
                      step="any"
                      value={criteriaForm[key] ?? ''}
                      onChange={(e) =>
                        setCriteriaForm((f: any) => ({
                          ...f,
                          [key]: +e.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
              <div
                className={styles.checkboxGrid}
                style={{ marginBottom: '0.875rem' }}
              >
                {(
                  [
                    ['requiresGuarantor', 'Guarantor required'],
                    ['requiresPayslip', 'Payslip required'],
                  ] as [string, string][]
                ).map(([key, lbl]) => (
                  <label key={key} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={!!criteriaForm[key]}
                      onChange={(e) =>
                        setCriteriaForm((f: any) => ({
                          ...f,
                          [key]: e.target.checked,
                        }))
                      }
                    />
                    {lbl}
                  </label>
                ))}
              </div>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.375rem',
                  fontSize: '0.8rem',
                  color: 'var(--ap-text-secondary)',
                }}
              >
                Notes (shown to users)
                <textarea
                  value={criteriaForm.notes || ''}
                  onChange={(e) =>
                    setCriteriaForm((f: any) => ({
                      ...f,
                      notes: e.target.value,
                    }))
                  }
                  rows={4}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--ap-border)',
                    borderRadius: '8px',
                    padding: '0.625rem',
                    color: 'var(--ap-text)',
                    width: '100%',
                    outline: 'none',
                  }}
                />
              </label>

              <div style={{ marginTop: '1.5rem' }}>
                <h4
                  style={{
                    color: 'var(--ap-text)',
                    marginBottom: '0.75rem',
                    fontSize: '0.95rem',
                  }}
                >
                  Custom Criteria
                </h4>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  {(criteriaForm.customCriteria || []).map(
                    (cc: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'center',
                        }}
                      >
                        <input
                          value={cc.name}
                          onChange={(e) => {
                            const updated = [
                              ...(criteriaForm.customCriteria || []),
                            ];
                            updated[i].name = e.target.value;
                            setCriteriaForm({
                              ...criteriaForm,
                              customCriteria: updated,
                            });
                          }}
                          placeholder="Criteria Name"
                          style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--ap-border)',
                            borderRadius: '8px',
                            padding: '0.625rem 0.875rem',
                            color: 'var(--ap-text)',
                            outline: 'none',
                          }}
                        />
                        <input
                          value={cc.value}
                          onChange={(e) => {
                            const updated = [
                              ...(criteriaForm.customCriteria || []),
                            ];
                            updated[i].value = e.target.value;
                            setCriteriaForm({
                              ...criteriaForm,
                              customCriteria: updated,
                            });
                          }}
                          placeholder="Value / Condition"
                          style={{
                            flex: 2,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--ap-border)',
                            borderRadius: '8px',
                            padding: '0.625rem 0.875rem',
                            color: 'var(--ap-text)',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (
                              criteriaForm.customCriteria || []
                            ).filter((_: any, idx: number) => idx !== i);
                            setCriteriaForm({
                              ...criteriaForm,
                              customCriteria: updated,
                            });
                          }}
                          style={{
                            display: 'flex',
                            background: 'none',
                            border: 'none',
                            color: 'var(--ap-danger)',
                            cursor: 'pointer',
                            padding: '0.25rem',
                          }}
                          aria-label="Remove criteria"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ),
                  )}
                  <button
                    onClick={() => {
                      const updated = [
                        ...(criteriaForm.customCriteria || []),
                        { name: '', value: '' },
                      ];
                      setCriteriaForm({
                        ...criteriaForm,
                        customCriteria: updated,
                      });
                    }}
                    className={styles.saveBtn}
                    style={{
                      width: 'fit-content',
                      marginTop: '0.5rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      background: 'rgba(255,255,255,0.08)',
                      color: 'var(--ap-text)',
                    }}
                  >
                    + Add Custom Criteria
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'docs' && (
            <div className={styles.formSection}>
              <h3>Required Documents</h3>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                {docs.length === 0 && (
                  <div
                    style={{
                      color: 'var(--ap-text-muted)',
                      fontSize: '0.875rem',
                    }}
                  >
                    No required documents defined.
                  </div>
                )}
                {docs.map((doc, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: '8px',
                      padding: '0.625rem 1rem',
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        color: 'var(--ap-text)',
                        fontSize: '0.875rem',
                      }}
                    >
                      • {doc}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeDoc(i)}
                      style={{
                        display: 'flex',
                        background: 'none',
                        border: 'none',
                        color: 'var(--ap-danger)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                      }}
                      aria-label="Remove document"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  value={newDoc}
                  onChange={(e) => setNewDoc(e.target.value)}
                  placeholder="e.g. National ID copy"
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--ap-border)',
                    borderRadius: '8px',
                    padding: '0.625rem 0.875rem',
                    color: 'var(--ap-text)',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && addDoc()}
                />
                <button
                  onClick={addDoc}
                  className={styles.saveBtn}
                  style={{ padding: '0.625rem 1.25rem' }}
                >
                  + Add
                </button>
              </div>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--ap-text-muted)',
                  marginTop: '0.5rem',
                }}
              >
                Changes here are saved when you click "Save Changes" above.
              </p>
            </div>
          )}

          {tab === 'products' && (
            <div className={styles.formSection}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <h3 style={{ marginBottom: 0, borderBottom: 'none' }}>
                  Loan Products
                </h3>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className={styles.addBtn}
                  style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                >
                  + Add Product
                </button>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {products.length === 0 && (
                  <div
                    style={{
                      color: 'var(--ap-text-muted)',
                      fontSize: '0.875rem',
                    }}
                  >
                    No loan products defined.
                  </div>
                )}
                {products.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--ap-border)',
                      borderRadius: '10px',
                      padding: '1rem 1.25rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div>
                        <div
                          style={{ fontWeight: 700, color: 'var(--ap-text)' }}
                        >
                          {p.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--ap-text-muted)',
                            marginTop: '4px',
                          }}
                        >
                          MWK {Number(p.minAmount).toLocaleString()} –{' '}
                          {Number(p.maxAmount).toLocaleString()} ·{' '}
                          {p.interestRate ? `${p.interestRate}% p.a. · ` : ''}
                          {p.processingFeePercent}% fee
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '20px',
                            background:
                              p.status === 'active'
                                ? 'rgba(34,197,94,0.15)'
                                : p.status === 'coming_soon'
                                  ? 'rgba(245,158,11,0.15)'
                                  : 'rgba(255,255,255,0.08)',
                            color:
                              p.status === 'active'
                                ? 'var(--ap-success)'
                                : p.status === 'coming_soon'
                                  ? 'var(--ap-warning)'
                                  : 'var(--ap-text-muted)',
                          }}
                        >
                          {p.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <button
                          onClick={() => {
                            const newStatus =
                              p.status === 'active' ? 'inactive' : 'active';
                            fetch(`/api/admin-panel/products/${p.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: newStatus }),
                            }).then(load);
                          }}
                          className={styles.actionBtn}
                        >
                          Toggle Status
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddProduct && (
        <AddProductModal
          institutionId={Number(id)}
          onClose={() => setShowAddProduct(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

function AddProductModal({
  institutionId,
  onClose,
  onSaved,
}: {
  institutionId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    minAmount: 50000,
    maxAmount: 5000000,
    interestRate: 25,
    repaymentPeriods: '12,24,36,60',
    processingFeePercent: 1.5,
    insuranceFeePercent: 0,
    collateralRequirements: '',
    conditions: '',
    status: 'active',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    const res = await fetch(
      `/api/admin-panel/institutions/${institutionId}/products`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      },
    );
    setSaving(false);
    if (res.ok) {
      onSaved();
      onClose();
    }
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Add Loan Product</h2>
          <ModalCloseButton className={styles.modalClose} onClose={onClose} />
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formSection}>
            <h3>Product Details</h3>
            <div className={styles.formGrid}>
              <label>
                Product Name *
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Village Bank Loan"
                />
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="coming_soon">Coming Soon</option>
                </select>
              </label>
              <label>
                Min Amount (MWK)
                <input
                  type="number"
                  value={form.minAmount}
                  onChange={(e) => set('minAmount', +e.target.value)}
                />
              </label>
              <label>
                Max Amount (MWK)
                <input
                  type="number"
                  value={form.maxAmount}
                  onChange={(e) => set('maxAmount', +e.target.value)}
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
                Insurance Fee (%)
                <input
                  type="number"
                  step="0.1"
                  value={form.insuranceFeePercent}
                  onChange={(e) => set('insuranceFeePercent', +e.target.value)}
                />
              </label>
              <label>
                Repayment Periods (months, comma-sep)
                <input
                  value={form.repaymentPeriods}
                  onChange={(e) => set('repaymentPeriods', e.target.value)}
                  placeholder="12,24,36,60"
                />
              </label>
            </div>
            <label>
              Collateral Requirements
              <textarea
                value={form.collateralRequirements}
                onChange={(e) => set('collateralRequirements', e.target.value)}
                rows={2}
              />
            </label>
            <label style={{ marginTop: '0.75rem' }}>
              Conditions / Notes
              <textarea
                value={form.conditions}
                onChange={(e) => set('conditions', e.target.value)}
                rows={3}
              />
            </label>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}
