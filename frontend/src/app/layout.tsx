import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DLEM | Digital Loan Eligibility & Management — Malawi",
  description:
    "Check your loan eligibility, apply for personal loans, and track repayments digitally. Serving Mwai Bank, Kokko Bank, and KFS Bank customers.",
  keywords: "loan, eligibility, Malawi, Mwai Bank, Kokko Bank, KFS Bank, digital banking",
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
