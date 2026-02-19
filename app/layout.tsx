import type { Metadata } from "next";
import { Geist, Geist_Mono, League_Spartan } from "next/font/google"; // Import League Spartan
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Configure the Brand Font
const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
  weight: ["700", "800"], // Bold weights for headings
});

export const metadata: Metadata = {
  title: "Objexia | Strategic Product Roadmap",
  description: "Plan, track, and deliver with Objexia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        // Add the variable here ---------------------------v
        className={`${geistSans.variable} ${geistMono.variable} ${leagueSpartan.variable} antialiased bg-slate-50 dark:bg-[#191b19] text-[#191b19] dark:text-slate-100`}
      >
        <AuthProvider>
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}