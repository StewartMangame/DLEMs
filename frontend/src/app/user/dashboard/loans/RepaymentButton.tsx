"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface RepaymentButtonProps {
  loanId: number;
  monthlyInstallment: number;
}

export default function RepaymentButton({ loanId, monthlyInstallment }: RepaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRepay = async () => {
    if (!confirm(`Confirm monthly repayment of MK ${monthlyInstallment.toLocaleString()}?\n\nReminder: Ensure sufficient funds are available in your account before deduction.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/loans/repay/${loanId}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Payment failed");
      } else {
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
      {loading ? "Processing..." : "Mark as Paid"}
    </button>
  );
}
