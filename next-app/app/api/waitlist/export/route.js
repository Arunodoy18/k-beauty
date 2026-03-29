import { NextResponse } from "next/server"

import { getSupabaseAdmin, MissingEnvironmentError } from "@/lib/supabase"

function escapeCsv(value) {
  const text = value == null ? "" : String(value)
  if (text.includes(",") || text.includes("\n") || text.includes("\"")) {
    return `"${text.replaceAll("\"", "\"\"")}"`
  }
  return text
}

export async function GET(request) {
  try {
    const token = process.env.ADMIN_DASHBOARD_TOKEN
    const providedToken = request.headers.get("x-admin-token") || request.nextUrl.searchParams.get("token")

    if (token && providedToken !== token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("waitlist")
      .select(
        "id,email,created_at,utm_source,utm_medium,utm_campaign,utm_term,utm_content,referrer,landing_path,device_type"
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[waitlist-export] query failed", error)
      return NextResponse.json({ error: "Unable to export waitlist" }, { status: 500 })
    }

    const headers = [
      "id",
      "email",
      "created_at",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "referrer",
      "landing_path",
      "device_type",
    ]

    const rows = (data || []).map((row) =>
      [
        row.id,
        row.email,
        row.created_at,
        row.utm_source,
        row.utm_medium,
        row.utm_campaign,
        row.utm_term,
        row.utm_content,
        row.referrer,
        row.landing_path,
        row.device_type,
      ]
        .map(escapeCsv)
        .join(",")
    )

    const csv = [headers.join(","), ...rows].join("\n")

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=waitlist-export.csv",
      },
    })
  } catch (error) {
    if (error instanceof MissingEnvironmentError) {
      console.error("[waitlist-export] supabase env configuration error", error)
      return NextResponse.json(
        { error: "Server configuration error. Waitlist export is unavailable." },
        { status: 500 }
      )
    }

    console.error("[waitlist-export] unexpected error", error)
    return NextResponse.json({ error: "Unable to export waitlist" }, { status: 500 })
  }
}
