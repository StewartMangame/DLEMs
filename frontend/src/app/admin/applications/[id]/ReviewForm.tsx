"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

interface ReviewFormProps {
  applicationId: number;
  currentStatus: string;
}

export default function ReviewForm({ applicationId, currentStatus }: ReviewFormProps) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");

  const act = async (action: "approve" | "reject") => {
    setLoading(action); setError("");
    const res = await fetch(`/api/admin/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, officerNotes: notes }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Action failed.");
      setLoading(null); return;
    }
    router.push("/admin");
    router.refresh();
  };

  if (currentStatus !== "PENDING") {
    return (
      <div className={`alert alert-info`}>
        This application has already been <strong>{currentStatus}</strong> and cannot be modified.
      </div>
    );
  }

  return (
    <div className={`card ${styles.reviewCard}`}>
      <h2 className="text-h3">Officer Decision</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="form-group">
        <label className="form-label" htmlFor="notes">Officer Notes (optional)</label>
        <textarea
          id="notes" rows={4} className="form-input"
          placeholder="Add remarks about this application…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          style={{ resize: "vertical" }}
        />
      </div>
      <div className={styles.decisionBtns}>
        <button
          className="btn btn-success btn-lg"
          onClick={() => act("approve")}
          disabled={!!loading}
        >
          {loading === "approve" ? <><span className="loading-spinner" /> Approving…</> : "✓ Approve Loan"}
        </button>
        <button
          className="btn btn-danger btn-lg"
          onClick={() => act("reject")}
          disabled={!!loading}
        >
          {loading === "reject" ? <><span className="loading-spinner" /> Rejecting…</> : "✗ Reject Application"}
        </button>
      </div>
    </div>
  );
}
