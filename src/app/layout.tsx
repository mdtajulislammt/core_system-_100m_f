import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OmniStream 100M | High-Scale Virtualized Data Platform",
  description:
    "Production-grade, 60 FPS virtualized data table supporting 100 Million records with cursor pagination, debounced search, AbortController cancellation, and optimistic UI mutations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-[#07090e] text-zinc-100 flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
