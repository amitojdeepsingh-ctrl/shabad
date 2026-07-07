import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shabad — Wisdom from Sri Guru Granth Sahib, Dasam Granth & Vaaran",
  description: "Read, understand, and apply the wisdom of Sri Guru Granth Sahib, Sri Dasam Granth, and Vaaran Bhai Gurdas to everyday life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-amber-50/40 text-stone-800">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
