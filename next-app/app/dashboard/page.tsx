"use client"

import { motion } from "framer-motion"
import { LogOut, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { useSupabaseClient } from "@/components/supabase-provider"

const PHASES = [
  {
    label: "Phase 1",
    title: "Account foundation",
    status: "Live now",
    description: "Email/password authentication and a private product dashboard.",
  },
  {
    label: "Phase 2",
    title: "Skin profile",
    status: "Next",
    description: "Collect skin type, goals, climate, allergies, budget, and routine habits.",
  },
  {
    label: "Phase 3",
    title: "AI skin analysis",
    status: "Planned",
    description: "Photo-based concern detection with careful disclaimers and reviewable outputs.",
  },
  {
    label: "Phase 4",
    title: "Routine builder",
    status: "Planned",
    description: "Ingredient-led Korean skincare routines tuned for Indian weather and concerns.",
  },
  {
    label: "Phase 5",
    title: "Commerce",
    status: "Planned",
    description: "Curated kits, subscriptions, order history, and post-purchase progress tracking.",
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const supabase = useSupabaseClient()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState("")

  useEffect(() => {
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
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!session) {
        router.replace("/login")
        return
      }

      setUser(session.user)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const onSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.replace("/login")
      router.refresh()
    } catch {
      setAuthError("Unable to sign out. Please refresh and try again.")
    }
  }

  if (isLoading) {
    return (
      <main className="dashboard-shell">
        <p className="dashboard-loading">Loading your MY GLOW space...</p>
      </main>
    )
  }

  if (authError) {
    return (
      <main className="dashboard-shell">
        <p className="dashboard-alert error">{authError}</p>
      </main>
    )
  }

  return (
    <main className="dashboard-shell">
      <motion.section
        className="dashboard-hero"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 0.68, 0, 1] }}
      >
        <div>
          <p className="dashboard-kicker">
            <Sparkles size={16} />
            Product phase 1
          </p>
          <h1>Your MY GLOW dashboard</h1>
          <p>
            Welcome{user?.email ? `, ${user.email}` : ""}. This is the foundation for the
            personalized skin analysis product we will build in phases.
          </p>
        </div>

        <Button variant="outline" onClick={onSignOut}>
          <LogOut size={16} />
          Sign out
        </Button>
      </motion.section>

      <section className="phase-grid" aria-label="Product phases">
        {PHASES.map((phase, index) => (
          <motion.article
            className="phase-card"
            key={phase.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: index * 0.05, ease: [0.22, 0.68, 0, 1] }}
          >
            <div className="phase-card-header">
              <span>{phase.label}</span>
              <strong>{phase.status}</strong>
            </div>
            <h2>{phase.title}</h2>
            <p>{phase.description}</p>
          </motion.article>
        ))}
      </section>
    </main>
  )
}
