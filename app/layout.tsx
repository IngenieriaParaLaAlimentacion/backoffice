import { CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import type { Metadata } from "next";
import MswProvider from "@/mocks/MswProvider";
import { theme } from "./theme";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Backoffice",
  description: "Backoffice administration panel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <MswProvider>
          <AppRouterCacheProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <AuthProvider>{children}</AuthProvider>
            </ThemeProvider>
          </AppRouterCacheProvider>
        </MswProvider>
      </body>
    </html>
  );
}
