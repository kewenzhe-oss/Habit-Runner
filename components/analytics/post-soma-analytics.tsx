"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Script from "next/script"

import {
  getAnalyticsConfig,
  shouldEnableAnalytics,
} from "@/lib/config/analytics"

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    __postsomaGaConfigured?: boolean
  }
}

function PostSomaAnalyticsInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchString = searchParams.toString()
  const [enabled, setEnabled] = useState(false)
  const lastTrackedUrlRef = useRef<string>("")

  const config = getAnalyticsConfig()
  const primaryGaId = config.rollupGaId || config.projectGaId

  useEffect(() => {
    if (typeof window === "undefined") return
    setEnabled(
      shouldEnableAnalytics(process.env.NODE_ENV, window.location.hostname)
    )
  }, [])

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !primaryGaId) return

    window.dataLayer = window.dataLayer || []
    if (typeof window.gtag !== "function") {
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer?.push(arguments)
      }
    }

    if (!window.__postsomaGaConfigured) {
      window.__postsomaGaConfigured = true
      window.gtag("js", new Date())

      if (config.rollupGaId) {
        window.gtag("config", config.rollupGaId, {
          send_page_view: false,
          project_name: config.projectName,
          cognitive_layer: config.cognitiveLayer,
          linker: {
            domains: config.crossDomains,
            accept_incoming: true,
          },
        })
      }

      if (config.projectGaId && config.projectGaId !== config.rollupGaId) {
        window.gtag("config", config.projectGaId, {
          send_page_view: false,
          project_name: config.projectName,
          cognitive_layer: config.cognitiveLayer,
        })
      }
    }
  }, [
    enabled,
    primaryGaId,
    config.rollupGaId,
    config.projectGaId,
    config.projectName,
    config.cognitiveLayer,
    config.crossDomains,
  ])

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !primaryGaId) return
    if (typeof window.gtag !== "function") return

    const pagePath = searchString ? `${pathname}?${searchString}` : pathname
    if (lastTrackedUrlRef.current === pagePath) return
    lastTrackedUrlRef.current = pagePath

    const eventPayload = {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
      project_name: config.projectName,
      cognitive_layer: config.cognitiveLayer,
    }

    if (config.rollupGaId) {
      window.gtag("event", "page_view", {
        ...eventPayload,
        send_to: config.rollupGaId,
      })
    }

    if (config.projectGaId && config.projectGaId !== config.rollupGaId) {
      window.gtag("event", "page_view", {
        ...eventPayload,
        send_to: config.projectGaId,
      })
    }
  }, [
    enabled,
    primaryGaId,
    pathname,
    searchString,
    config.rollupGaId,
    config.projectGaId,
    config.projectName,
    config.cognitiveLayer,
  ])

  if (!enabled) {
    return null
  }

  return (
    <>
      {primaryGaId ? (
        <Script
          id="postsoma-gtag-loader"
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(primaryGaId)}`}
          strategy="afterInteractive"
        />
      ) : null}
      {config.umamiWebsiteId && config.umamiScriptUrl ? (
        <Script
          id="postsoma-umami-loader"
          src={config.umamiScriptUrl}
          data-website-id={config.umamiWebsiteId}
          data-exclude-search="true"
          strategy="afterInteractive"
        />
      ) : null}
    </>
  )
}

export function PostSomaAnalytics() {
  return (
    <Suspense fallback={null}>
      <PostSomaAnalyticsInner />
    </Suspense>
  )
}
