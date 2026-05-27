import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DLEM | Digital Loan Eligibility and Management Malawi",
  description:
    "Compare loan eligibility across Malawian lenders and track personal repayments digitally.",
  keywords:
    "loan, eligibility, Malawi, banks, microfinance, SACCO, digital lending",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
