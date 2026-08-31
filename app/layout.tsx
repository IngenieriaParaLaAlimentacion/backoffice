import type { Metadata } from "next";
import MswProvider from "@/mocks/MswProvider";
import { AuthProvider } from "@/context/AuthContext";
import { Fraunces, IBM_Plex_Mono, Work_Sans } from "next/font/google";
import { BRAND } from "@/constants/brand";
import { cn } from "@/lib/utils";
import "./globals.css";

// The three families of the "Raíz" type stack, same roles as the mobile app:
// Fraunces for display/titles, Work Sans for body and UI, IBM Plex Mono for
// numbers that are read as data. IBM Plex Mono is not a variable font on
// Google Fonts, so an explicit weight is required.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-heading",
});
const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: BRAND.name,
  description: BRAND.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn(
        "font-sans",
        fraunces.variable,
        workSans.variable,
        plexMono.variable,
      )}
    >
      <body>
        <MswProvider>
          <AuthProvider>{children}</AuthProvider>
        </MswProvider>
      </body>
    </html>
  );
}
