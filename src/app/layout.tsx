import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/auth-context";
import { ReactQueryProvider } from "@/providers/query-provider";
import { Toaster } from "react-hot-toast";
import "@fontsource/press-start-2p";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "MemCard - Your Personal Video Game Library",
  description: "Manage and track your video game collection with MemCard",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "icon", url: "/favicon.svg", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
    { rel: "icon", url: "/favicon-white.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" }
  ]
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-background`}>
        <AuthProvider>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="light" 
            disableTransitionOnChange
            forcedTheme={undefined}
            themes={["light", "dark", "cyberpunk", "retro", "colorblind", "nintendo", "playstation", "xbox"]}
          >
            <ReactQueryProvider>
              {children}
              <Toaster position="top-right" />
            </ReactQueryProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}