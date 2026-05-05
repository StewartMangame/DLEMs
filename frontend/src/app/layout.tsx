import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DLEM | Digital Loan Eligibility and Management Malawi",
  description:
    "Compare loan eligibility across Malawian lenders and track personal repayments digitally.",
  keywords:
    "loan, eligibility, Malawi, banks, microfinance, SACCO, digital lending",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
