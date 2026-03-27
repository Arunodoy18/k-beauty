type EventPayload = {
  email?: string
  path?: string
  referrer?: string
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmTerm?: string | null
  utmContent?: string | null
  deviceType?: string
  metadata?: Record<string, unknown>
}

function getDeviceType() {
  if (typeof navigator === "undefined") return "unknown"

  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes("ipad") || (ua.includes("android") && !ua.includes("mobile"))) {
    return "tablet"
  }
  if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("android")) {
    return "mobile"
  }
  return "desktop"
}

export function getAttributionData() {
  if (typeof window === "undefined") {
    return {
      path: "/",
      referrer: "",
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmTerm: null,
      utmContent: null,
      deviceType: "unknown",
    }
  }

  const params = new URLSearchParams(window.location.search)

  return {
    path: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || "",
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmTerm: params.get("utm_term"),
    utmContent: params.get("utm_content"),
    deviceType: getDeviceType(),
  }
}

export async function trackEvent(eventName: string, payload: EventPayload = {}) {
  try {
    await fetch("/api/analytics/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventName, payload }),
      keepalive: true,
    })
  } catch {
    // Do not block UX on telemetry failures.
  }
}
