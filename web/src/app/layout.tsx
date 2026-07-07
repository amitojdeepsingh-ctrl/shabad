import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Shabad — Guru Granth Sahib, Dasam Granth & Vaaran",
  description: "Read and reflect on the wisdom of Sri Guru Granth Sahib, Sri Dasam Granth, and Vaaran Bhai Gurdas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-dvh flex flex-col">
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
