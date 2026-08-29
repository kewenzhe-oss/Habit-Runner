import "./globals.css"

import { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import NextTopLoader from "nextjs-toploader"

import { siteConfig } from "@/config/site"
import {
  createOrganizationJsonLd,
  createWebsiteJsonLd,
} from "@/lib/structured-data"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { StructuredData } from "@/components/seo/structured-data"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url.base),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [
    {
      name: siteConfig.author,
      url: siteConfig.url.author,
    },
  ],
  creator: siteConfig.author,
  applicationName: siteConfig.name,
  category: "lifestyle",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url.base,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  icons: {
    icon: [
      {
        url: "/favicon-target-20260828.ico",
        type: "image/x-icon",
      },
      {
        url: "/favicon-target-16-20260828.png",
        type: "image/png",
        sizes: "16x16",
      },
      {
        url: "/favicon-target-32-20260828.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    shortcut: "/favicon-target-20260828.ico",
    apple: [
      {
        url: "/apple-touch-target-20260828.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#DC2626",
      },
    ],
  },
  manifest: "/site-target-20260828.webmanifest",
  other: {
    "msapplication-TileColor": "#DC2626",
    "msapplication-config": "/browserconfig.xml",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="describedby"
          href="/llms.txt"
          type="text/markdown"
          title="Habit Runner machine-readable summary"
        />
        <StructuredData
          id="habit-runner-organization"
          data={createOrganizationJsonLd()}
        />
        <StructuredData
          id="habit-runner-website"
          data={createWebsiteJsonLd()}
        />
      </head>
      <body className={cn("antialiased", inter.className)}>
        <a
          href="#main-content"
          className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-md bg-background px-4 py-3 text-sm font-semibold shadow-lg focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          跳到主要内容
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <NextTopLoader color="#DC2645" height={2.5} showSpinner={false} />
          <div
            vaul-drawer-wrapper=""
            className="flex min-h-screen flex-col bg-background"
          >
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
