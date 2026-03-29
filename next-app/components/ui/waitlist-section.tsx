"use client"

import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react"
import { FormEvent, useEffect, useState } from "react"

import { getAttributionData, trackEvent } from "@/lib/analytics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function WaitlistSection() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [waitlistNumber, setWaitlistNumber] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const attribution = getAttributionData()
    void trackEvent("landing_page_view", {
      path: attribution.path,
      referrer: attribution.referrer,
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      utmTerm: attribution.utmTerm,
      utmContent: attribution.utmContent,
      deviceType: attribution.deviceType,
    })
  }, [])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim()) return

    const normalizedEmail = email.trim().toLowerCase()
    const attribution = getAttributionData()

    setIsLoading(true)
    setError("")
    setWaitlistNumber(null)

    console.info("[waitlist-form] submit started", {
      email: normalizedEmail,
      path: attribution.path,
    })

    void trackEvent("waitlist_submit_started", {
      email: normalizedEmail,
      path: attribution.path,
      referrer: attribution.referrer,
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      utmTerm: attribution.utmTerm,
      utmContent: attribution.utmContent,
      deviceType: attribution.deviceType,
    })

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          path: attribution.path,
          referrer: attribution.referrer,
          utmSource: attribution.utmSource,
          utmMedium: attribution.utmMedium,
          utmCampaign: attribution.utmCampaign,
          utmTerm: attribution.utmTerm,
          utmContent: attribution.utmContent,
          deviceType: attribution.deviceType,
        }),
      })

      let payload: {
        message?: string
        error?: string
        waitlistNumber?: number
      } = {}

      try {
        payload = (await response.json()) as {
          message?: string
          error?: string
          waitlistNumber?: number
        }
      } catch {
        payload = {
          error: response.ok ? undefined : "Unexpected server response. Please try again.",
        }
      }

      console.info("[waitlist-form] response received", {
        status: response.status,
        payload,
      })

      if (!response.ok) {
        setSubmitted(false)
        setError(payload.error ?? "Something went wrong. Please try again.")
        setWaitlistNumber(payload.waitlistNumber ?? null)

        void trackEvent(
          response.status === 409 ? "waitlist_submit_duplicate" : "waitlist_submit_error",
          {
            email: normalizedEmail,
            path: attribution.path,
            utmSource: attribution.utmSource,
            utmMedium: attribution.utmMedium,
            utmCampaign: attribution.utmCampaign,
            deviceType: attribution.deviceType,
            metadata: {
              status: response.status,
              message: payload.error ?? "unknown_error",
              waitlistNumber: payload.waitlistNumber ?? null,
            },
          }
        )
        return
      }

      setSubmitted(true)
      setEmail("")
      setWaitlistNumber(payload.waitlistNumber ?? null)

      console.info("[waitlist-form] submit succeeded", {
        email: normalizedEmail,
        waitlistNumber: payload.waitlistNumber ?? null,
      })

      void trackEvent("waitlist_submit_success", {
        email: normalizedEmail,
        path: attribution.path,
        utmSource: attribution.utmSource,
        utmMedium: attribution.utmMedium,
        utmCampaign: attribution.utmCampaign,
        deviceType: attribution.deviceType,
        metadata: {
          waitlistNumber: payload.waitlistNumber ?? null,
        },
      })
    } catch (submitError) {
      setSubmitted(false)
      setError("Network error. Please check your connection and try again.")
      setWaitlistNumber(null)

      console.error("[waitlist-form] submit failed", submitError)

      void trackEvent("waitlist_submit_error", {
        email: normalizedEmail,
        path: attribution.path,
        utmSource: attribution.utmSource,
        utmMedium: attribution.utmMedium,
        utmCampaign: attribution.utmCampaign,
        deviceType: attribution.deviceType,
        metadata: {
          message: "network_error",
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="waitlist-shell" id="waitlist" aria-label="Join waitlist">
      <div className="waitlist-card">
        <div className="waitlist-badge">
          <Sparkles size={16} />
          <span>MY GLOW</span>
        </div>

        <h2>Join the MY GLOW Early Access Waitlist</h2>
        <p>
          Get your personalized Korean skincare routine powered by AI, built for Indian
          skin, climate, and concerns.
        </p>

        <form className="waitlist-form" onSubmit={onSubmit}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email for early access"
            aria-label="Email address"
            className="waitlist-input"
            disabled={isLoading}
            required
          />

          <Button
            type="submit"
            className="waitlist-button"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? "Submitting..." : "Get My Free Skin Report"}
          </Button>
        </form>

        {submitted ? (
          <div className="waitlist-success" role="status" aria-live="polite">
            <CheckCircle2 size={16} />
            <span>
              You&apos;re on the waitlist!
              {waitlistNumber
                ? ` Your waitlist number is #${waitlistNumber}.`
                : " We&apos;ll send your skin report soon."}
            </span>
          </div>
        ) : null}

        {error ? (
          <div className="waitlist-error" role="alert" aria-live="assertive">
            <AlertCircle size={16} />
            <span>
              {error}
              {waitlistNumber ? ` Your current waitlist number is #${waitlistNumber}.` : ""}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  )
}
