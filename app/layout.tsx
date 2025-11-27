// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./Home/Navbar";
import Footer from "./Home/Footer";
import { Toaster } from "sonner";
import SessionProviderWrapper from "./sessionProviderWrapper";
import CookieConsent from "./Home/CookieConsent";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Syke World",
  description: "Come enjoy luxury, your one stop spot in the heart of Paidha Town - Zombo District",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-200`}>
        <SessionProviderWrapper>
          <Navbar />
          {children}
          <Footer />
          <Toaster position="bottom-right" />
          <CookieConsent/>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
