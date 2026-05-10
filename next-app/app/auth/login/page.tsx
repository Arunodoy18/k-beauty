import Link from "next/link"

import { AuthForm } from "@/components/auth/auth-form"

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <Link className="auth-home-link" href="/">
        MY GLOW
      </Link>
      <AuthForm mode="login" />
    </main>
  )
}
