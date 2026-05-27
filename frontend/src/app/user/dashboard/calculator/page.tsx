"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { fetchInstitutionCriteria, fetchInstitutions } from "@/lib/api";

type Institution = { id: string; name: string };
type Product = {
  product_name: string;
  min_amount: number;
  max_amount: number;
  interest_rate_fixed: boolean;
  interest_rate_value: number | null;
  repayment_periods: number[];
  processing_fee_percent: number;
};
type Criteria = {
  id: string;
  name: string;
  dti_cap_percent: number;
  loan_products: Product[];
};

const currency = (value: number) =>
  `MK ${Math.round(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function monthlyInstallment(amount: number, annualRate: number, months: number) {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return amount / months;
  return (
    (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
}

export default function CalculatorPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [criteria, setCriteria] = useState<Criteria | null>(null);
  const [productIndex, setProductIndex] = useState(0);
  const [amount, setAmount] = useState(0);
  const [rate, setRate] = useState(24);
  const [months, setMonths] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInstitutions()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setInstitutions(list);
        if (list[0]) setSelectedId(list[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load institutions."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setError(null);
    fetchInstitutionCriteria(Number(selectedId))
      .then((data) => {
        setCriteria(data);
        const first = data.loan_products[0];
        setProductIndex(0);
        setAmount(first?.min_amount ?? 0);
        setRate(first?.interest_rate_fixed ? first.interest_rate_value ?? 0 : 24);
        setMonths(first?.repayment_periods[0] ?? 12);
      })
      .catch((err) => {
        setCriteria(null);
        setError(err instanceof Error ? err.message : "Failed to load criteria.");
      });
  }, [selectedId]);

  const product = criteria?.loan_products[productIndex];
  const installment = useMemo(
    () => monthlyInstallment(amount, rate, months),
    [amount, rate, months],
  );
  const total = installment * months;

  if (loading) return <div className={styles.page}>Loading calculator...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className="text-h2">Loan Calculator</h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Caps, rates, and terms come from the live institution criteria API.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className={styles.grid}>
        <div className={`card ${styles.controls}`}>
          <div className="form-group">
            <label className="form-label" htmlFor="institution">Institution</label>
            <select
              id="institution"
              className="form-select"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {institutions.map((institution) => (
                <option key={institution.id} value={institution.id}>
                  {institution.name}
                </option>
              ))}
            </select>
          </div>

          {criteria && product && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="product">Loan Product</label>
                <select
                  id="product"
                  className="form-select"
                  value={productIndex}
                  onChange={(event) => {
                    const nextIndex = Number(event.target.value);
                    const nextProduct = criteria.loan_products[nextIndex];
                    setProductIndex(nextIndex);
                    setAmount(nextProduct.min_amount);
                    setRate(
                      nextProduct.interest_rate_fixed
                        ? nextProduct.interest_rate_value ?? 0
                        : rate,
                    );
                    setMonths(nextProduct.repayment_periods[0]);
                  }}
                >
                  {criteria.loan_products.map((item, index) => (
                    <option key={item.product_name} value={index}>
                      {item.product_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Loan Amount: {currency(amount)}</label>
                <input
                  type="range"
                  className={styles.slider}
                  min={product.min_amount}
                  max={product.max_amount}
                  step={50000}
                  value={amount}
                  onChange={(event) => setAmount(Number(event.target.value))}
                />
                <div className={styles.rangeLabels}>
                  <span>{currency(product.min_amount)}</span>
                  <span>{currency(product.max_amount)}</span>
                </div>
              </div>

              {!product.interest_rate_fixed && (
                <div className="form-group">
                  <label className="form-label" htmlFor="rate">Annual Interest Rate</label>
                  <input
                    id="rate"
                    type="number"
                    className="form-input"
                    min={0}
                    step={0.1}
                    value={rate}
                    onChange={(event) => setRate(Number(event.target.value))}
                  />
                </div>
              )}

              {product.interest_rate_fixed && (
                <div className="form-group">
                  <label className="form-label">Annual Interest Rate</label>
                  <input className="form-input" value={`${rate}% fixed`} disabled />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="months">Repayment Period</label>
                <select
                  id="months"
                  className="form-select"
                  value={months}
                  onChange={(event) => setMonths(Number(event.target.value))}
                >
                  {product.repayment_periods.map((period) => (
                    <option key={period} value={period}>
                      {period} months
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className={styles.summary}>
          <div className={`card ${styles.summaryCard}`}>
            <div className="stat-label">Monthly Installment</div>
            <div className="stat-value text-gradient">{currency(installment)}</div>
          </div>
          <div className={`card ${styles.summaryCard}`}>
            <div className="stat-label">Total Repayable</div>
            <div className="stat-value">{currency(total)}</div>
          </div>
          <div className={`card ${styles.summaryCard}`}>
            <div className="stat-label">DTI Cap</div>
            <div className="stat-value">{criteria?.dti_cap_percent ?? "-"}%</div>
          </div>
          <div className={`card ${styles.summaryCard}`}>
            <div className="stat-label">Processing Fee</div>
            <div className="stat-value">
              {product ? `${product.processing_fee_percent ?? 0}%` : "-"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
