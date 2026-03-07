import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Onyx",
  description: "Daily priority engine for ranked execution lists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${plexMono.variable} min-h-screen bg-stone-100 text-stone-950 antialiased`}>
        {children}
      </body>
    </html>
  );
}
