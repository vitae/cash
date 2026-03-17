import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flow Arts Professional — By Glow Wit Da Flow",
  description: "AI-powered tools that write your sponsor pitches, build your booking sheets, and assemble your press kit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ background: "#000", margin: 0, fontFamily: "'Montserrat', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
