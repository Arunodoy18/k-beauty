"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Bell, Camera, FileText, Home, ListChecks, UserRound } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ReactNode, useEffect, useMemo, useRef, useState } from "react"
import type { Session, SupabaseClient, User } from "@supabase/supabase-js"

import { AppProvider } from "@/components/app/app-context"
import { MissingEnvironmentError, getSupabaseBrowserClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/scan", label: "Scan", icon: Camera },
  { href: "/report", label: "Report", icon: FileText },
  { href: "/routine", label: "Routine", icon: ListChecks },
  { href: "/profile", label: "Profile", icon: UserRound },
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState("")
  const [isScrolled, setIsScrolled] = useState(false)
  const [isNavVisible, setIsNavVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    let supabase: SupabaseClient

    try {
      supabase = getSupabaseBrowserClient() as SupabaseClient
    } catch (error) {
      queueMicrotask(() => {
        setAuthError(
          error instanceof MissingEnvironmentError
            ? "Supabase auth is not configured yet. Add the public Supabase env vars."
            : "Unable to load authentication."
        )
        setIsLoading(false)
      })
      return
    }

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!data.session) {
        router.replace("/login")
        return
      }

      setUser(data.session.user)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login")
        return
      }

      setUser(session.user)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY
      setIsScrolled(currentScrollY > 16)

      if (Math.abs(currentScrollY - lastScrollY.current) > 8) {
        setIsNavVisible(currentScrollY < lastScrollY.current || currentScrollY < 32)
        lastScrollY.current = currentScrollY
      }
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const avatarLabel = useMemo(() => {
    const email = user?.email ?? "M"
    return email.slice(0, 1).toUpperCase()
  }, [user])

  const onTabClick = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(8)
    }
  }

  if (isLoading) {
    return (
      <main className="app-loading-screen">
        <p>Preparing your glow ritual...</p>
      </main>
    )
  }

  if (authError) {
    return (
      <main className="app-loading-screen">
        <p className="dashboard-alert error">{authError}</p>
      </main>
    )
  }

  return (
    <AppProvider userId={user?.id ?? null}>
      <div className="app-shell">
        <header className={cn("app-topbar", isScrolled && "is-solid")}>
          <Link className="app-brand" href="/home">
            MY GLOW
          </Link>
          <div className="app-topbar-actions">
            <button className="app-icon-button" aria-label="Notifications" type="button">
              <Bell size={18} />
            </button>
            <Link className="app-avatar" href="/profile" aria-label="Open profile">
              {avatarLabel}
            </Link>
          </div>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={pathname}
            className="app-page-frame"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ type: "spring", stiffness: 360, damping: 34, mass: 0.7 }}
          >
            {children}
          </motion.main>
        </AnimatePresence>

        <motion.nav
          className="app-bottom-nav"
          aria-label="Primary"
          animate={{ y: isNavVisible ? 0 : 110, opacity: isNavVisible ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                className={cn("app-nav-tab", isActive && "is-active")}
                href={item.href}
                key={item.href}
                onClick={onTabClick}
              >
                <motion.span
                  animate={{ y: isActive ? -2 : 0, scale: isActive ? 1.04 : 1 }}
                  transition={{ type: "spring", stiffness: 480, damping: 25 }}
                >
                  <Icon size={20} />
                </motion.span>
                <span>{item.label}</span>
                {isActive ? (
                  <motion.i className="app-nav-underline" layoutId="app-nav-underline" />
                ) : null}
              </Link>
            )
          })}
        </motion.nav>
      </div>
    </AppProvider>
  )
}
