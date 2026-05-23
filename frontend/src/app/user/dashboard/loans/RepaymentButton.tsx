"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface RepaymentButtonProps {
  loanId: number;
  remainingBalance: number;
  onComplete?: () => void;
}

export default function RepaymentButton({ loanId, remainingBalance, onComplete }: RepaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRepay = async () => {
    if (!confirm(`Mark this whole loan as fully paid?\n\nRemaining balance: MK ${remainingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/loans/complete/${loanId}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Could not complete loan");
      } else {
        onComplete?.();
        router.refresh();
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      className="btn btn-primary btn-sm" 
      onClick={handleRepay} 
      disabled={loading}
      style={{ width: "100%", marginTop: 16 }}
    >
      {loading ? "Processing..." : "Mark Loan as Fully Paid"}
    </button>
  );
}
