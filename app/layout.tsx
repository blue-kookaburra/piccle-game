import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, JetBrains_Mono, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://piccle.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Piccle — Daily Photography Guessing Game",
    template: "%s | Piccle",
  },
  description:
    "Piccle is a free daily photography game. Study the photo, then guess the shutter speed, aperture, and focal length used to take it. New challenge every day — develop your eye.",
  keywords: [
    "piccle",
    "piccle game",
    "photography game",
    "daily photo game",
    "camera settings game",
    "guess the settings",
    "photo puzzle",
    "wordle photography",
    "aperture game",
    "shutter speed game",
  ],
  authors: [{ name: "Piccle" }],
  creator: "Piccle",
  publisher: "Piccle",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Piccle",
    url: "/",
    title: "Piccle — Daily Photography Guessing Game",
    description:
      "Study the photo. Guess the shutter speed, aperture, and focal length. New challenge every day.",
  },
  twitter: {
    card: "summary",
    title: "Piccle — Daily Photography Guessing Game",
    description:
      "Study the photo. Guess the shutter speed, aperture, and focal length. New challenge every day.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Piccle",
              url: SITE_URL,
              description:
                "A free daily photography guessing game. Study the photo, then guess the shutter speed, aperture, and focal length used to take it.",
              applicationCategory: "GameApplication",
              genre: "Puzzle",
              operatingSystem: "Any",
              browserRequirements: "Requires JavaScript",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
        {children}
        <Analytics />
        <Script id="ms-clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "w85xr8yj2o");
        `}</Script>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-93SHB0646Y" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-93SHB0646Y');
        `}</Script>
      </body>
    </html>
  );
}
