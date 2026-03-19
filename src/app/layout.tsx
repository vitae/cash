import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "../../public/fonts/inter-latin.woff2",
  display: "swap",
  variable: "--font-inter",
});

const siteUrl = "https://cash-gwdf.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: {
    default: "Flow Arts Professional — By Glow Wit Da Flow",
    template: "%s | Flow Arts Professional",
  },
  description:
    "AI-powered tools that write your sponsor pitches, build your booking sheets, and assemble your press kit. Built for flow artists, by flow artists.",
  keywords: [
    "flow arts",
    "fire spinning",
    "poi",
    "LED performance",
    "sponsor pitch",
    "booking sheet",
    "press kit",
    "AI tools",
    "glow wit da flow",
    "flow artist",
    "performance art",
  ],
  authors: [{ name: "Glow Wit Da Flow" }],
  creator: "Glow Wit Da Flow",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Flow Arts Professional",
    title: "Flow Arts Professional — By Glow Wit Da Flow",
    description:
      "AI-powered tools that write your sponsor pitches, build your booking sheets, and assemble your press kit.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Flow Arts Professional",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flow Arts Professional — By Glow Wit Da Flow",
    description:
      "AI-powered tools that write your sponsor pitches, build your booking sheets, and assemble your press kit.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
