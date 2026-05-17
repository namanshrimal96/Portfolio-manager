import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Portfolio Manager",
  description: "Credit Card & Loyalty Portfolio Manager",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-cream text-ink font-sans antialiased">
        <div className="flex min-h-screen">
          <Navigation />
          <main className="flex-1 ml-56 p-8 max-w-4xl">{children}</main>
        </div>
      </body>
    </html>
  );
}
