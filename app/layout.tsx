import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, JetBrains_Mono, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const bodoniModa = Bodoni_Moda({
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "700"],
  variable: "--font-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  weight: ["400", "500"],
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PICCLE — Develop your eye.",
  description: "One photo. Three numbers. Every day.",
  openGraph: {
    title: "PICCLE",
    description: "Develop your eye. One photo. Three numbers. Every day.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#07090f",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bodoniModa.variable} ${jetbrainsMono.variable} ${outfit.variable}`}
    >
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
