import { AppShell } from "@/components/app/app-shell"
import PWAInstallBanner from "@/components/PWAInstallBanner"

export default function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
      <PWAInstallBanner />
    </AppShell>
  )
}
