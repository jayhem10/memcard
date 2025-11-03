import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/auth-context";
import { ReactQueryProvider } from "@/providers/query-provider";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";
import { WebSiteSchema, OrganizationSchema, WebApplicationSchema } from "@/components/schema-org";
import "@fontsource/press-start-2p";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.memcard.fr'),
  
  title: {
    default: "MemCard - Votre Bibliothèque de Jeux Vidéo Personnelle",
    template: "%s | MemCard"
  },
  
  description: "Gérez et suivez votre collection de jeux vidéo avec MemCard. Catalogue complet, suivi des prix, liste de souhaits et bien plus encore.",
  
  keywords: [
    "jeux vidéo",
    "collection",
    "bibliothèque de jeux",
    "gestion de collection",
    "catalogue de jeux",
    "liste de souhaits",
    "prix de jeux",
    "retrogaming",
    "PlayStation",
    "Xbox",
    "Nintendo",
    "PC gaming"
  ],
  
  authors: [{ name: "MemCard" }],
  creator: "MemCard",
  publisher: "MemCard",
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  icons: [
    { rel: "icon", url: "/favicon.ico", sizes: "any" },
    { rel: "icon", url: "/favicon.svg", type: "image/svg+xml" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png", sizes: "180x180" },
    { rel: "icon", url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    { rel: "icon", url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
  ],
  
  manifest: "/manifest.json",
  
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: ["en_US"],
    url: "/",
    siteName: "MemCard",
    title: "MemCard - Votre Bibliothèque de Jeux Vidéo Personnelle",
    description: "Gérez et suivez votre collection de jeux vidéo avec MemCard. Catalogue complet, suivi des prix, liste de souhaits et bien plus encore.",
    images: [
      {
        url: "/memcard.png",
        width: 1200,
        height: 630,
        alt: "MemCard - Gestion de Collection de Jeux Vidéo",
      },
    ],
  },
  
  twitter: {
    card: "summary_large_image",
    title: "MemCard - Votre Bibliothèque de Jeux Vidéo Personnelle",
    description: "Gérez et suivez votre collection de jeux vidéo avec MemCard",
    images: ["/memcard.png"],
    creator: "@memcard",
  },
  
  category: "gaming",
  
  verification: {
    // Ajoutez vos codes de vérification Google Search Console ici
    // google: 'votre-code-de-verification-google',
  },
  
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <WebSiteSchema />
        <OrganizationSchema />
        <WebApplicationSchema />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background">
        <AuthProvider>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="light" 
            disableTransitionOnChange
            forcedTheme={undefined}
            themes={["light", "dark", "cyberpunk", "retro", "fantasy", "nintendo", "playstation", "xbox"]}
          >
            <ReactQueryProvider>
              {children}
              <Toaster position="top-right" />
              <Analytics />
            </ReactQueryProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}