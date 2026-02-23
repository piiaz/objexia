import type { Metadata } from "next";
import { Geist, Geist_Mono, League_Spartan } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import CommandPalette from "./components/CommandPalette"; // <--- ADDED IMPORT

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
    <html lang="en" className="scroll-smooth">
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable} ${leagueSpartan.variable} 
          antialiased bg-slate-50 dark:bg-[#121417] 
          text-slate-900 dark:text-slate-100
          selection:bg-[#3f407e]/20
        `}
      >
        <AuthProvider>
            {/* THE COMMAND PALETTE: Accessible via Cmd+K or Ctrl+K anywhere */}
            <CommandPalette />
            
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}