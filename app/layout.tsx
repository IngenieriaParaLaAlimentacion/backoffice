import type { Metadata } from "next";
import MswProvider from "@/mocks/MswProvider";
import { AuthProvider } from "@/context/AuthContext";
import localFont from "next/font/local";
import { BRAND } from "@/constants/brand";
import { cn } from "@/lib/utils";
import "./globals.css";

// Keep the Raíz type stack in the repo so Docker builds never fetch Google Fonts.
const fraunces = localFont({
  src: "./fonts/fraunces.ttf",
  weight: "400 600",
  variable: "--font-heading",
  display: "swap",
});
const workSans = localFont({
  src: "./fonts/work-sans.ttf",
  weight: "400 600",
  variable: "--font-sans",
  display: "swap",
});
const plexMono = localFont({
  src: "./fonts/ibm-plex-mono-medium.ttf",
  weight: "500",
  variable: "--font-mono",
  display: "swap",
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
