"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSupabaseClient } from "@/components/supabase-provider"

type AuthMode = "login" | "signup"

type AuthFormProps = {
  mode: AuthMode
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const supabase = useSupabaseClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const isSignup = mode === "signup"

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setMessage("")
    setIsLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()

      if (isSignup) {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo:
              typeof window === "undefined" ? undefined : `${window.location.origin}/home`,
          },
        })

        if (signupError) {
          setError(signupError.message)
          return
        }

        if (data.session) {
          router.replace("/home")
          router.refresh()
          return
        }

        setMessage("Account created. Check your email to confirm your sign up.")
        return
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (loginError) {
        setError(loginError.message)
        return
      }

      router.replace("/home")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 0.68, 0, 1] }}
      className="w-full max-w-md"
    >
      <Card className="auth-card">
        <CardHeader>
          <p className="eyebrow">{isSignup ? "Begin ritual" : "Return ritual"}</p>
          <CardTitle className="auth-title">
            {isSignup ? "Create your MY GLOW account" : "Log in to MY GLOW"}
          </CardTitle>
          <CardDescription>
            {isSignup
              ? "Phase 1 gives you a secure account before we add skin profiles and AI analysis."
              : "Continue building your personalized skincare profile."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <label className="grid gap-2 text-sm font-medium text-[var(--blush)]">
              Email
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
                required
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--blush)]">
              Password
              <Input
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                disabled={isLoading}
                required
              />
            </label>

            <Button type="submit" className="h-11" disabled={isLoading}>
              {isLoading ? "Please wait..." : isSignup ? "Sign up" : "Log in"}
            </Button>
          </form>

          {message ? <p className="auth-message success">{message}</p> : null}

          {error ? <p className="auth-message error">{error}</p> : null}

          <p className="auth-switch">
            {isSignup ? "Already have an account?" : "New to MY GLOW?"}{" "}
            <Link href={isSignup ? "/login" : "/signup"}>
              {isSignup ? "Log in" : "Create an account"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
