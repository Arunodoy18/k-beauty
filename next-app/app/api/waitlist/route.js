import { NextResponse } from "next/server"

import { applyRateLimit } from "@/lib/rate-limit"
import { getSupabaseAdmin, MissingEnvironmentError } from "@/lib/supabase"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_EMAIL_LENGTH = 320

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

async function getWaitlistNumber(supabase, id) {
  const { count, error } = await supabase
    .from("waitlist")
    .select("id", { count: "exact", head: true })
    .lte("id", id)

  if (error) {
    throw error
  }

  return count || 0
}

export async function POST(request) {
  try {
    const limiter = applyRateLimit({
      request,
      storeName: "waitlist-submit",
      keySuffix: "post",
      limit: 6,
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

    let body = {}
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[waitlist] invalid JSON body", parseError)
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 })
    }

    const email = String(body?.email || "")
      .trim()
      .toLowerCase()
    const userAgent = request.headers.get("user-agent") || ""

    console.info("[waitlist] submission received", {
      email,
      path: body?.path ? String(body.path) : null,
    })

    if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("waitlist")
      .insert({
      email,
      utm_source: body?.utmSource ? String(body.utmSource) : null,
      utm_medium: body?.utmMedium ? String(body.utmMedium) : null,
      utm_campaign: body?.utmCampaign ? String(body.utmCampaign) : null,
      utm_term: body?.utmTerm ? String(body.utmTerm) : null,
      utm_content: body?.utmContent ? String(body.utmContent) : null,
      referrer: body?.referrer ? String(body.referrer) : request.headers.get("referer") || null,
      landing_path: body?.path ? String(body.path) : null,
      device_type: body?.deviceType ? String(body.deviceType) : detectDeviceType(userAgent),
      user_agent: userAgent || null,
    })
      .select("id")
      .single()

    if (error) {
      if (error.code === "23505") {
        const existing = await supabase
          .from("waitlist")
          .select("id")
          .eq("email", email)
          .single()

        if (!existing.error && existing.data?.id) {
          const waitlistNumber = await getWaitlistNumber(supabase, existing.data.id)
          console.info("[waitlist] duplicate email", { email, waitlistNumber })

          return NextResponse.json(
            {
              error: "This email is already on the waitlist.",
              waitlistNumber,
            },
            { status: 409 }
          )
        }

        return NextResponse.json({ error: "This email is already on the waitlist." }, { status: 409 })
      }

      console.error("[waitlist] insert error", error)
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      )
    }

    const waitlistNumber = await getWaitlistNumber(supabase, data.id)

    console.info("[waitlist] inserted successfully", {
      email,
      waitlistNumber,
      id: data.id,
    })

    return NextResponse.json(
      {
        message: "You're on the waitlist!",
        waitlistNumber,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof MissingEnvironmentError) {
      console.error("[waitlist] supabase env configuration error", error)
      return NextResponse.json(
        {
          error:
            "Server configuration error. Please contact support if this persists.",
        },
        { status: 500 }
      )
    }

    console.error("[waitlist] API error", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
