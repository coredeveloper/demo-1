import type { Metadata } from "next";
import { Public_Sans, Fraunces, JetBrains_Mono } from "next/font/google";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { DemoBanner } from "@/components/layout/demo-banner";
import { PageFooter } from "@/components/layout/page-footer";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Fraunces is a variable font with custom axes (optical size + softness).
// Per Next.js: when `axes` is set, `weight` must be omitted so the variable
// version is loaded.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "State Survey Automation · PruittHealth",
  description:
    "Local prototype — turns CMS-2567 PDFs into FHIR R4 resources and AI-drafted Plans of Correction.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${fraunces.variable} ${mono.variable}`}
    >
      <body className="bg-ph-gray-50 text-ph-ink">
        <DemoBanner />
        <div className="grid min-h-[calc(100vh-28px)] grid-cols-[260px_1fr]">
          <Sidebar />
          <div className="flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <PageFooter />
          </div>
        </div>
      </body>
    </html>
  );
}
