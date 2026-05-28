"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

interface RepaymentButtonProps {
  loanId: number;
  remainingBalance: number;
  onComplete?: () => void;
}

export default function RepaymentButton({ loanId, remainingBalance, onComplete }: RepaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  const handleRepay = async () => {
    if (!confirm(t("loans.markPaidConfirm", {
      balance: remainingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 }),
    }))) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/loans/complete/${loanId}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || t("loans.completeError"));
      } else {
        onComplete?.();
        router.refresh();
      }
    } catch {
      alert(t("auth.networkError"));
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
      {loading ? t("loans.processing") : t("loans.markFullyPaid")}
    </button>
  );
}
