"use client";

import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { readJson } from "@/lib/http";
import styles from "../institutions/institutions.module.css";

type Summary = {
  today: number;
  this_week: number;
  this_month: number;
  all_time: number;
};

type BreakdownRow = {
  institution_id: string;
  institution_name: string;
  institution_type: string;
  total_checks: number;
  likely_eligible: number;
  borderline: number;
  not_eligible: number;
  eligible_rate: number;
};

const PERIODS = [
  { label: "All Time", value: "all_time" },
  { label: "This Month", value: "this_month" },
  { label: "This Week", value: "this_week" },
  { label: "Today", value: "today" },
];

function formatInstitutionType(type: string) {
  switch (type) {
    case "COMMERCIAL_BANK":
      return "Commercial Bank";
    case "MICROFINANCE":
      return "Microfinance";
    case "SACCO":
      return "SACCO";
    default:
      return type || "-";
  }
}

export default function EligibilityMonitorPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownRow[]>([]);
  const [period, setPeriod] = useState("all_time");
  const [loading, setLoading] = useState(true);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    fetch("/api/admin/eligibility/summary", { cache: "no-store" })
      .then((r) => readJson<Summary>(r, "Failed to load eligibility summary"))
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setBreakdownLoading(true);
    fetch(`/api/admin/eligibility/breakdown?period=${period}`, {
      cache: "no-store",
    })
      .then((r) =>
        readJson<BreakdownRow[]>(r, "Failed to load eligibility breakdown"),
      )
      .then((rows) => setBreakdown(Array.isArray(rows) ? rows : []))
      .catch(() => setBreakdown([]))
      .finally(() => setBreakdownLoading(false));
  }, [period]);

  useEffect(() => {
    if (!canvasRef.current || breakdown.length === 0) {
      chartRef.current?.destroy();
      chartRef.current = null;
      return;
    }

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: breakdown.map((row) => row.institution_name),
        datasets: [
          {
            label: "Likely Eligible",
            data: breakdown.map((row) => row.likely_eligible),
            backgroundColor: "#00c896",
          },
          {
            label: "Borderline",
            data: breakdown.map((row) => row.borderline),
            backgroundColor: "#ffb800",
          },
          {
            label: "Not Eligible",
            data: breakdown.map((row) => row.not_eligible),
            backgroundColor: "#ff3b5c",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "rgba(226, 232, 240, 0.9)" },
          },
          title: {
            display: true,
            text: "Eligibility Results by Institution",
            color: "rgba(226, 232, 240, 0.95)",
            font: { size: 16, weight: "bold" },
          },
        },
        scales: {
          x: {
            ticks: { color: "rgba(148, 163, 184, 0.95)" },
            grid: { color: "rgba(255, 255, 255, 0.06)" },
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              color: "rgba(148, 163, 184, 0.95)",
            },
            grid: { color: "rgba(255, 255, 255, 0.06)" },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [breakdown]);

  if (loading) {
    return (
      <div className={styles.loadingCell} style={{ padding: "3rem" }}>
        Loading...
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Eligibility Check Monitor</h1>
          <p className={styles.pageSub}>
            Anonymised aggregate data - no individual user data shown
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {[
          { label: "Today", value: summary.today },
          { label: "This Week", value: summary.this_week },
          { label: "This Month", value: summary.this_month },
          { label: "All Time", value: summary.all_time },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--ap-surface)",
              border: "1px solid var(--ap-border)",
              borderRadius: "8px",
              padding: "1.5rem 1.75rem",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--ap-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "0.5rem",
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: "2.25rem",
                fontWeight: 800,
                color: "var(--ap-text)",
              }}
            >
              {Number(s.value || 0).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        <h2
          style={{
            fontSize: "0.875rem",
            fontWeight: 700,
            color: "var(--ap-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Breakdown by Institution
        </h2>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            color: "var(--ap-text-secondary)",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          Period
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            style={{
              minWidth: 160,
              background: "var(--ap-input-bg)",
              color: "var(--ap-text)",
              border: "1px solid var(--ap-border)",
              borderRadius: "8px",
              padding: "0.65rem 0.8rem",
              font: "inherit",
            }}
          >
            {PERIODS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

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
            {breakdownLoading ? (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
                  Loading breakdown...
                </td>
              </tr>
            ) : !breakdown.length ? (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
                  No eligibility check data yet. Checks are recorded when users
                  run the eligibility engine.
                </td>
              </tr>
            ) : (
              breakdown.map((row) => (
                <tr key={`${row.institution_id}-${row.institution_name}`}>
                  <td className={styles.instName}>{row.institution_name}</td>
                  <td>
                    <span className={styles.typeBadge}>
                      {formatInstitutionType(row.institution_type)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {Number(row.total_checks).toLocaleString()}
                  </td>
                  <td style={{ color: "#00c896" }}>
                    {Number(row.likely_eligible || 0).toLocaleString()}
                  </td>
                  <td style={{ color: "#ffb800" }}>
                    {Number(row.borderline || 0).toLocaleString()}
                  </td>
                  <td style={{ color: "#ff3b5c" }}>
                    {Number(row.not_eligible || 0).toLocaleString()}
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          minWidth: 70,
                          height: "6px",
                          background: "rgba(255,255,255,0.08)",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${row.eligible_rate}%`,
                            height: "100%",
                            background:
                              row.eligible_rate > 60
                                ? "#00c896"
                                : row.eligible_rate > 30
                                  ? "#ffb800"
                                  : "#ff3b5c",
                            borderRadius: "3px",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "var(--ap-text)",
                          minWidth: "3rem",
                        }}
                      >
                        {Number(row.eligible_rate || 0).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: "1.5rem",
          background: "var(--ap-surface)",
          border: "1px solid var(--ap-border)",
          borderRadius: "8px",
          padding: "1.25rem",
          minHeight: 360,
        }}
      >
        {!breakdown.length ? (
          <div
            style={{
              minHeight: 310,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ap-text-muted)",
              textAlign: "center",
            }}
          >
            Chart will appear here once eligibility checks have been recorded.
          </div>
        ) : (
          <div style={{ position: "relative", height: 330 }}>
            <canvas ref={canvasRef} aria-label="Eligibility Results by Institution" />
          </div>
        )}
      </div>
    </div>
  );
}
