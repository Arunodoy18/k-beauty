'use client'

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())
    setIsIOS(ios)

    const handler = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setTimeout(() => setShowBanner(true), 3000)
    }

    window.addEventListener("beforeinstallprompt", handler)

    if (ios) {
      const dismissed = localStorage.getItem("pwa-ios-dismissed")
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 5000)
      }
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") setShowBanner(false)
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    setShowBanner(false)
    if (isIOS) localStorage.setItem("pwa-ios-dismissed", "true")
  }

  if (isInstalled || !showBanner) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          position: "fixed",
          bottom: 80,
          left: 16,
          right: 16,
          zIndex: 999,
          background: "#1F1015",
          border: "1px solid rgba(196,154,108,0.3)",
          borderRadius: 20,
          padding: "16px 20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#0D0608",
              border: "1px solid rgba(196,154,108,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontFamily: "Cormorant Garamond, serif",
              fontSize: 18,
              color: "#C49A6C",
            }}
          >
            MG
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#E8C9A0",
                marginBottom: 2,
              }}
            >
              Add MY GLOW to home screen
            </p>
            <p style={{ fontSize: 12, color: "#9A7A70", lineHeight: 1.4 }}>
              {isIOS
                ? "Tap the share icon then \"Add to Home Screen\""
                : "Install for the full app experience"}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            {!isIOS && (
              <button
                onClick={handleInstall}
                style={{
                  background: "#D4856A",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Install
              </button>
            )}
            <button
              onClick={handleDismiss}
              style={{
                background: "transparent",
                color: "#9A7A70",
                border: "none",
                fontSize: 12,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              Not now
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
