import type { Metadata } from "next";
import { GlobalChatBubble } from "@/components/global-chat-bubble";
import { JetBrains_Mono, Montserrat } from "next/font/google";
import { EmailVerificationBanner } from '@/components/common/EmailVerificationBanner'
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-body",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Moon Strike | Game Boosting Marketplace",
  description:
    "Moon Strike helps gamers order boosting, coaching, and item services through a premium cosmic marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${jetBrainsMono.variable}`}>
        <EmailVerificationBanner />
        {children}
        <GlobalChatBubble />
      </body>
    </html>
  );
}