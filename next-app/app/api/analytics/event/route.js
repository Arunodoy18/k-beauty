import { NextResponse } from "next/server"

import { applyRateLimit } from "@/lib/rate-limit"
import { getSupabaseAdmin } from "@/lib/supabase"

function detectDeviceType(userAgent = "") {
  const ua = userAgent.toLowerCase()
  if (ua.includes("ipad") || (ua.includes("android") && !ua.includes("mobile"))) {
    return "tablet"
  }
  if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("android")) {
    return "mobile"
  }
  if (ua) return "desktop"
  return "unknown"
}

export async function POST(request) {
  try {
    const limiter = applyRateLimit({
      request,
      storeName: "waitlist-events",
      keySuffix: "post",
      limit: 60,
      windowMs: 60_000,
    })

    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait and try again." },
        {
          status: 429,
          headers: { "Retry-After": String(limiter.retryAfterSeconds) },
        }
      )
    }

    const body = await request.json()
    const eventName = String(body?.eventName || "").trim()
    const payload = body?.payload && typeof body.payload === "object" ? body.payload : {}

    if (!eventName) {
      return NextResponse.json({ error: "eventName is required" }, { status: 400 })
    }

    const userAgent = request.headers.get("user-agent") || ""
    const referer = request.headers.get("referer") || ""

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from("waitlist_events").insert({
      event_name: eventName,
      email: payload.email ? String(payload.email).trim().toLowerCase() : null,
      path: payload.path ? String(payload.path) : null,
      referrer: payload.referrer ? String(payload.referrer) : referer,
      utm_source: payload.utmSource ? String(payload.utmSource) : null,
      utm_medium: payload.utmMedium ? String(payload.utmMedium) : null,
      utm_campaign: payload.utmCampaign ? String(payload.utmCampaign) : null,
      utm_term: payload.utmTerm ? String(payload.utmTerm) : null,
      utm_content: payload.utmContent ? String(payload.utmContent) : null,
      device_type: payload.deviceType
        ? String(payload.deviceType)
        : detectDeviceType(userAgent),
      user_agent: userAgent || null,
      metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata : null,
    })

    if (error) {
      console.error("Event insert error:", error)
      return NextResponse.json({ error: "Unable to store event" }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error("Event API error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
