import { Component as LuminaInteractiveList } from "@/components/ui/lumina-interactive-list"
import { Component as ArgentLoopInfiniteSlider } from "@/components/ui/argent-loop-infinite-slider"
import { LandingSections } from "@/components/ui/landing-sections"
import { WaitlistSection } from "@/components/ui/waitlist-section"

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

      <WaitlistSection />
    </main>
  )
}
