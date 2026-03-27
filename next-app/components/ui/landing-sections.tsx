import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Ingredient = {
  name: string
  benefit: string
}

const INGREDIENTS: Ingredient[] = [
  { name: "Niacinamide", benefit: "Oil control, acne marks" },
  { name: "Centella", benefit: "Skin repair" },
  { name: "Snail Mucin", benefit: "Repair and hydration" },
  { name: "Hyaluronic Acid", benefit: "Deep hydration" },
  { name: "Rice Water", benefit: "Brightening" },
]

export function LandingSections() {
  return (
    <div className="landing-sections-shell">
      <section className="brand-block" aria-label="Problem section">
        <h2>Skincare feels confusing because everything says something different.</h2>
        <div className="brand-problem-grid">
          <p>Too many products</p>
          <p>Too many ingredients</p>
          <p>Too many influencer recommendations</p>
          <p>People do not know what their skin actually needs</p>
        </div>
      </section>

      <section className="brand-block" aria-label="Solution section">
        <h2>How MY GLOW solves this</h2>
        <p>
          MY GLOW is an AI-powered skin analysis platform designed for Indian skin and
          climate, inspired by Korean skincare philosophy.
        </p>
        <ul className="brand-pill-list" role="list">
          <li>AI analyzes your skin</li>
          <li>Detects skin type and concerns</li>
          <li>Recommends right ingredients</li>
          <li>Builds a simple routine you can follow</li>
        </ul>
      </section>

      <section className="brand-block" aria-label="How it works section">
        <h2>How it works</h2>
        <div className="brand-steps-grid">
          <article>
            <span>1</span>
            <h3>Upload your photo</h3>
          </article>
          <article>
            <span>2</span>
            <h3>AI analyzes your skin</h3>
          </article>
          <article>
            <span>3</span>
            <h3>Get your personalized routine</h3>
          </article>
        </div>
      </section>

      <section className="brand-block" aria-label="Ingredients section">
        <h2>Ingredient intelligence your skin can trust</h2>
        <div className="brand-ingredient-grid">
          {INGREDIENTS.map((ingredient) => (
            <Card key={ingredient.name} className="brand-ingredient-card">
              <CardHeader>
                <CardTitle>{ingredient.name}</CardTitle>
                <CardDescription>Ingredient spotlight</CardDescription>
              </CardHeader>
              <CardContent>
                <p>{ingredient.benefit}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="brand-block" aria-label="Trust section">
        <h2>Built for trust, not hype</h2>
        <div className="brand-trust-grid">
          <p>Ingredient-based recommendations</p>
          <p>No harsh chemicals</p>
          <p>Dermatology research based</p>
          <p>Built for Indian skin and climate</p>
        </div>
      </section>
    </div>
  )
}
