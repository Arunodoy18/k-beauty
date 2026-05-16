import { Cormorant_Garamond, DM_Mono, DM_Sans } from "next/font/google"
import type { Metadata, Viewport } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SupabaseProvider } from "@/components/supabase-provider"
import { cn } from "@/lib/utils"

const heading = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-heading-face",
  weight: ["400", "500", "600", "700"],
})

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans-face",
})

const mono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono-face",
  weight: ["400", "500"],
})

export const viewport: Viewport = {
  themeColor: "#0D0608",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: "MY GLOW - AI Korean Skincare for Indian Skin",
  description:
    "Upload your photo, get a free AI skin report, then buy a simple K-beauty routine matched to your Indian skin and city climate.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://myglow.buildc3.tech"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MY GLOW",
    startupImage: [
      {
        url: "/splash/splash-2048x2732.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/splash-1668x2224.png",
        media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/splash-1242x2688.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-1125x2436.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-750x1334.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  openGraph: {
    title: "MY GLOW - AI Korean Skincare",
    description: "Free AI skin analysis personalized for Indian skin and climate",
    url: "https://myglow.buildc3.tech",
    siteName: "MY GLOW",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MY GLOW - AI Korean Skincare",
    description: "Free AI skin analysis for Indian skin",
    images: ["/og-image.png"],
  },
  keywords: [
    "korean skincare",
    "AI skin analysis",
    "Indian skin",
    "K-beauty",
    "skin routine",
    "skincare India",
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("dark antialiased scroll-smooth", heading.variable, sans.variable, mono.variable)}
    >
      <body
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <ThemeProvider>
          <SupabaseProvider>{children}</SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
