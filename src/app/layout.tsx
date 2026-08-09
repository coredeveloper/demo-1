import type { Metadata } from "next";
import { Public_Sans, Fraunces, JetBrains_Mono } from "next/font/google";
import { DemoBanner } from "@/components/layout/demo-banner";
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
  title: "PruittHealth · AI Demos",
  description:
    "Demo prototypes — State Survey Automation and the AI Command Center (Financial Insights & Survey Intelligence).",
};

/**
 * Root layout carries only fonts, global styles, and the demo banner.
 * Each app surface brings its own shell: the survey suite's sidebar lives in
 * (survey)/layout.tsx; the Financial AI Command Center's independent chrome
 * lives in financial/layout.tsx.
 */
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
        {children}
      </body>
    </html>
  );
}
