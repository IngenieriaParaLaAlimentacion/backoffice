import type { Metadata } from "next";
import MswProvider from "@/mocks/MswProvider";
import { AuthProvider } from "@/context/AuthContext";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Ingeniería Para La Alimentación",
  description: "Panel de administración.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <MswProvider>
          <AuthProvider>{children}</AuthProvider>
        </MswProvider>
      </body>
    </html>
  );
}
