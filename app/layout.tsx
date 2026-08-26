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
    // General boosting terms
    "game boosting",
    "elo boost",
    "game coaching",
    "rank boost",
    "carry service",
    "gaming marketplace",
    "boosting service",
    "power leveling",
    "account boosting",
    "competitive boosting",
    
    // Specific game boosting
    "Guild Wars 2 boosting",
    "GW2 boosting",
    "Guild Wars 2 carry",
    "GW2 legendary armor",
    "GW2 raids boosting",
    "Black Desert Online boosting",
    "BDO boosting",
    "BDO enhancement service",
    "BDO grinding service",
    "Maplestory boosting",
    "Maplestory meso farming",
    "Maplestory leveling service",
    "Crimson Desert boosting",
    
    // Geo-targeted keywords - North America
    "game boosting USA",
    "game boosting Canada",
    "boosting service North America",
    "US game carry service",
    "Canadian gaming boosting",
    
    // Geo-targeted keywords - Europe
    "game boosting UK",
    "game boosting Europe",
    "EU boosting service",
    "European game carry",
    "game boosting Germany",
    "game boosting France",
    "game boosting Spain",
    
    // Geo-targeted keywords - Asia Pacific
    "game boosting Australia",
    "game boosting Singapore",
    "game boosting Japan",
    "game boosting Korea",
    "APAC gaming services",
    "OCE boosting service",
    
    // Service-specific keywords
    "MMO boosting",
    "MMORPG carry service",
    "raid boosting",
    "dungeon carry",
    "achievement boosting",
    "gear farming service",
    "gold farming service",
    "arena boosting",
    "battleground carry",
    
    // Platform keywords
    "PC game boosting",
    "Steam game boosting",
    "online gaming marketplace",
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
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LVV65QMDFY"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LVV65QMDFY');
          `}
        </Script>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '38272410049038920');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=38272410049038920&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>
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