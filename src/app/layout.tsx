import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/layout/service-worker-register";
import "./globals.css";

// Fallback font for non-Apple devices (Apple devices use SF Pro, see globals.css)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Elegant serif for a few headline moments (the Today greeting, the assistant)
const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: "Cadence", template: "%s · Cadence" },
  description: "One calm place for your plans, habits, home and money.",
  appleWebApp: { capable: true, title: "Cadence", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e6" },
    { media: "(prefers-color-scheme: dark)", color: "#070b15" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable} h-full`}>
      <body className="min-h-full font-sans">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
