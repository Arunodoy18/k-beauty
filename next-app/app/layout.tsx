import { Cormorant_Garamond, DM_Mono, DM_Sans } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("dark antialiased", heading.variable, sans.variable, mono.variable)}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
