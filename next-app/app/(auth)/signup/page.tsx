import Link from "next/link"

import { AuthForm } from "@/components/auth/auth-form"

export default function SignupPage() {
  return (
    <main className="auth-shell">
      <Link className="auth-home-link" href="/">
        MY GLOW
      </Link>
      <AuthForm mode="signup" />
    </main>
  )
}
