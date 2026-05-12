"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import styles from "../../institutions.module.css";

export default function InstitutionChangelogPage() {
  const { id } = useParams<{ id: string }>();
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [instName, setInstName] = useState("");

  useEffect(() => {
    fetch(`/api/admin/institutions/${id}`)
      .then(r => r.json())
      .then(d => setInstName(d.institution?.name || ""));
  }, [id]);

  useEffect(() => {
    fetch(`/api/admin/institutions/${id}/changelog?page=${page}`)
      .then(r => r.json())
      .then(d => { setEntries(d.items || []); setTotal(d.total || 0); });
  }, [id, page]);

  const pages = Math.ceil(total / 50);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <div style={{ fontSize: "0.8rem", color: "var(--ap-text-muted)", marginBottom: "0.5rem" }}>
            <Link href="/admin/institutions" style={{ color: "var(--ap-accent-light)", textDecoration: "none" }}>← Institutions</Link>
            {" / "}
            <Link href={`/admin/institutions/${id}`} style={{ color: "var(--ap-accent-light)", textDecoration: "none" }}>{instName}</Link>
          </div>
          <h1 className={styles.pageTitle}>Change Log</h1>
          <p className={styles.pageSub}>{total} changes recorded for {instName}</p>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Field Changed</th>
              <th>Old Value</th>
              <th>New Value</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={7} className={styles.emptyCell}>No changes recorded yet.</td></tr>
            ) : entries.map(e => (
              <tr key={e.id}>
                <td className={styles.dateCell}>{new Date(e.createdAt).toLocaleString()}</td>
                <td style={{ fontSize: "0.85rem", color: "var(--ap-text)" }}>{e.admin?.email || "—"}</td>
                <td><span className={styles.typeBadge}>{e.action}</span></td>
                <td style={{ color: "var(--ap-text-secondary)", fontSize: "0.85rem" }}>{e.fieldChanged || "—"}</td>
                <td style={{ color: "var(--ap-danger)", fontSize: "0.8rem", fontFamily: "monospace", maxWidth: "150px", wordBreak: "break-all" }}>{e.oldValue || "—"}</td>
                <td style={{ color: "var(--ap-success)", fontSize: "0.8rem", fontFamily: "monospace", maxWidth: "150px", wordBreak: "break-all" }}>{e.newValue || "—"}</td>
                <td style={{ color: "var(--ap-text-muted)", fontSize: "0.8rem" }}>{e.description || "—"}</td>
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
