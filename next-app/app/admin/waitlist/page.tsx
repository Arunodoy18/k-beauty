import Link from "next/link"

import { getSupabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

type WaitlistEntry = {
  id: number
  email: string
  created_at: string
  utm_source: string | null
  utm_campaign: string | null
  landing_path: string | null
  device_type: string | null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default async function WaitlistAdminPage() {
  const supabase = getSupabaseAdmin()
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)

  const [
    totalWaitlistResult,
    todayWaitlistResult,
    pageViewResult,
    submitStartResult,
    recentWaitlistResult,
  ] = await Promise.all([
    supabase.from("waitlist").select("id", { count: "exact", head: true }),
    supabase
      .from("waitlist")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("waitlist_events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", "landing_page_view"),
    supabase
      .from("waitlist_events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", "waitlist_submit_started"),
    supabase
      .from("waitlist")
      .select("id,email,created_at,utm_source,utm_campaign,landing_path,device_type")
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  const totalWaitlist = totalWaitlistResult.count || 0
  const todayWaitlist = todayWaitlistResult.count || 0
  const landingViews = pageViewResult.count || 0
  const submitStarts = submitStartResult.count || 0

  const viewToSubmitRate = landingViews > 0 ? (submitStarts / landingViews) * 100 : 0
  const submitToSignupRate = submitStarts > 0 ? (totalWaitlist / submitStarts) * 100 : 0
  const recentEntries = ((recentWaitlistResult.data || []) as WaitlistEntry[])

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">GLOW AI Waitlist Insights</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Real-time funnel snapshot for ideation and validation.
          </p>
        </div>

        <Link
          href="/api/waitlist/export"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Export CSV
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Total Signups</p>
          <p className="mt-2 text-3xl font-semibold">{totalWaitlist}</p>
        </article>

        <article className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Today Signups</p>
          <p className="mt-2 text-3xl font-semibold">{todayWaitlist}</p>
        </article>

        <article className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">View to Submit Rate</p>
          <p className="mt-2 text-3xl font-semibold">{viewToSubmitRate.toFixed(1)}%</p>
        </article>

        <article className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Submit to Signup Rate</p>
          <p className="mt-2 text-3xl font-semibold">{submitToSignupRate.toFixed(1)}%</p>
        </article>
      </section>

      <section className="mt-8 overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-4 py-3 text-sm font-medium">Recent Waitlist Entries</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">UTM Source</th>
                <th className="px-4 py-3">UTM Campaign</th>
                <th className="px-4 py-3">Path</th>
                <th className="px-4 py-3">Device</th>
              </tr>
            </thead>
            <tbody>
              {recentEntries.map((entry) => (
                <tr key={entry.id} className="border-t">
                  <td className="px-4 py-3">{entry.email}</td>
                  <td className="px-4 py-3">{formatDate(entry.created_at)}</td>
                  <td className="px-4 py-3">{entry.utm_source || "-"}</td>
                  <td className="px-4 py-3">{entry.utm_campaign || "-"}</td>
                  <td className="px-4 py-3">{entry.landing_path || "-"}</td>
                  <td className="px-4 py-3">{entry.device_type || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
