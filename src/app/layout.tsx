import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { SiteFooter } from "@/components/site-footer";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import { defaultDescription, siteName, siteUrl } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: siteName,
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    "World Cup",
    "football",
    "soccer",
    "fan memorial",
    "World Cup 2026",
    "Italy football",
    "football satire",
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: "sports entertainment",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteName,
    description: defaultDescription,
    url: "/",
    siteName,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: defaultDescription,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const headerLocale = requestHeaders.get("x-worldcup-locale") ?? defaultLocale;
  const locale: Locale = isLocale(headerLocale) ? headerLocale : defaultLocale;

  return (
    <html
      lang={locale === "zh" ? "zh-CN" : locale}
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
