import Link from "next/link"

import { Component as LuminaInteractiveList } from "@/components/ui/lumina-interactive-list"
import { Component as ArgentLoopInfiniteSlider } from "@/components/ui/argent-loop-infinite-slider"
import { LandingSections } from "@/components/ui/landing-sections"

export default function Page() {
  return (
    <main className="landing-stack">
      <section aria-label="Landing Showcase">
        <LuminaInteractiveList />
      </section>

      <LandingSections />

      <section className="argent-loop-section" aria-label="Featured Loop Slider">
        <ArgentLoopInfiniteSlider />
      </section>

      <section className="product-entry-shell" aria-label="Start MY GLOW">
        <div className="product-entry-panel">
          <p className="product-entry-kicker">Phase 1 is open</p>
          <h2>Create your MY GLOW account</h2>
          <p>
            We are moving into the first product phase. Start with a secure account today;
            skin profiles, AI analysis, routines, and shopping flows will ship in phases.
          </p>
          <div className="product-entry-actions">
            <Link className="product-entry-primary" href="/signup">
              Sign up
            </Link>
            <Link className="product-entry-secondary" href="/login">
              Log in
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
