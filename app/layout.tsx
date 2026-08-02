import type { Metadata } from "next";
import { GlobalChatBubble } from "@/components/global-chat-bubble";
import { Cabin, Montserrat } from "next/font/google";
import { EmailVerificationBanner } from '@/components/common/EmailVerificationBanner'
import { JsonLd } from "@/components/JsonLd";
import "./globals.css";
import Script from "next/script";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-body",
  display: "swap",
});

const cabin = Cabin({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonstrike.pro';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Moon Strike | Game Boosting Marketplace",
    template: "%s | Moon Strike",
  },
  description:
    "Moon Strike helps gamers order boosting, coaching, and item services through a premium cosmic marketplace.",
  keywords: [
    "game boosting",
    "elo boost",
    "game coaching",
    "rank boost",
    "carry service",
    "gaming marketplace",
    "boosting service",
  ],
  authors: [{ name: "Moon Strike", url: BASE_URL }],
  creator: "Moon Strike",
  publisher: "Moon Strike",
  category: "Gaming",
  icons: {
    icon: "/logo/icon.png",
    shortcut: "/logo/icon.png",
    apple: "/logo/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Moon Strike",
    title: "Moon Strike | Game Boosting Marketplace",
    description:
      "Moon Strike helps gamers order boosting, coaching, and item services through a premium cosmic marketplace.",
    images: [
      {
        url: "/logo/logo.png",
        width: 1200,
        height: 630,
        alt: "Moon Strike — Game Boosting Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moon Strike | Game Boosting Marketplace",
    description:
      "Moon Strike helps gamers order boosting, coaching, and item services through a premium cosmic marketplace.",
    images: ["/logo/logo.png"],
    creator: "@moonstrike",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${cabin.variable}`}>
        <JsonLd type="website" />
        <EmailVerificationBanner />
        {children}
        <GlobalChatBubble />

        <Script
          src="https://kit.fontawesome.com/92a240245c.js" 
          crossOrigin="anonymous"
          strategy="afterInteractive" 
        />
      </body>
    </html>
  );
}